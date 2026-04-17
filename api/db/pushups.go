package db

import (
	"fmt"
)

// PushupEntry represents a single day's pushup count for a user.
type PushupEntry struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Date     string `json:"date"` // YYYY-MM-DD
	Count    int    `json:"count"`
}

// UpsertPushups adds pushups for a given user on a given date.
// If a record already exists for that day it is replaced (the new count is the total for the day).
func (db *DB) UpsertPushups(userID int64, date string, count int) (*PushupEntry, error) {
	_, err := db.Exec(`
		INSERT INTO pushups (user_id, date, count)
		VALUES (?, ?, ?)
		ON CONFLICT(user_id, date) DO UPDATE SET count = excluded.count
	`, userID, date, count)
	if err != nil {
		return nil, fmt.Errorf("upsert pushups: %w", err)
	}

	return db.GetPushupsByUserAndDate(userID, date)
}

// GetPushupsByUserAndDate fetches a single day's entry.
func (db *DB) GetPushupsByUserAndDate(userID int64, date string) (*PushupEntry, error) {
	e := &PushupEntry{}
	err := db.QueryRow(`
		SELECT p.user_id, u.username, p.date, p.count
		FROM pushups p
		JOIN users u ON u.id = p.user_id
		WHERE p.user_id = ? AND p.date = ?
	`, userID, date).Scan(&e.UserID, &e.Username, &e.Date, &e.Count)
	if err != nil {
		return nil, fmt.Errorf("get pushups: %w", err)
	}
	return e, nil
}

// QueryParams filters for the GET /pushups endpoint.
type QueryParams struct {
	UserIDs   []int64 // optional – filter by specific users
	StartDate string  // optional – YYYY-MM-DD inclusive
	EndDate   string  // optional – YYYY-MM-DD inclusive
}

// GraphPoint is one data point returned by the graph-ready query.
type GraphPoint struct {
	Date     string `json:"date"`
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Count    int    `json:"count"`
}

// GraphResponse is the top-level response for the GET /pushups endpoint.
type GraphResponse struct {
	Points []GraphPoint       `json:"points"`
	Users  []GraphUserSummary `json:"users"`
}

// GraphUserSummary contains per-user aggregate stats.
type GraphUserSummary struct {
	UserID   int64  `json:"user_id"`
	Username string `json:"username"`
	Total    int    `json:"total"`
	Days     int    `json:"days"`
}

// GetPushupsForGraph returns pushup data shaped for charting: sorted by date then user.
func (db *DB) GetPushupsForGraph(p QueryParams) (*GraphResponse, error) {
	query := `
		SELECT p.date, p.user_id, u.username, p.count
		FROM pushups p
		JOIN users u ON u.id = p.user_id
		WHERE 1=1
	`
	args := []any{}

	if p.StartDate != "" {
		query += ` AND p.date >= ?`
		args = append(args, p.StartDate)
	}
	if p.EndDate != "" {
		query += ` AND p.date <= ?`
		args = append(args, p.EndDate)
	}
	if len(p.UserIDs) > 0 {
		query += ` AND p.user_id IN (`
		for i, id := range p.UserIDs {
			if i > 0 {
				query += ","
			}
			query += "?"
			args = append(args, id)
		}
		query += `)`
	}

	query += ` ORDER BY p.date ASC, u.username ASC`

	rows, err := db.Query(query, args...)
	if err != nil {
		return nil, fmt.Errorf("get pushups for graph: %w", err)
	}
	defer rows.Close()

	// Aggregate per user
	userTotals := map[int64]*GraphUserSummary{}
	var points []GraphPoint

	for rows.Next() {
		var gp GraphPoint
		if err := rows.Scan(&gp.Date, &gp.UserID, &gp.Username, &gp.Count); err != nil {
			return nil, err
		}
		points = append(points, gp)

		if _, ok := userTotals[gp.UserID]; !ok {
			userTotals[gp.UserID] = &GraphUserSummary{UserID: gp.UserID, Username: gp.Username}
		}
		userTotals[gp.UserID].Total += gp.Count
		userTotals[gp.UserID].Days++
	}
	if err := rows.Err(); err != nil {
		return nil, err
	}

	summaries := make([]GraphUserSummary, 0, len(userTotals))
	for _, s := range userTotals {
		summaries = append(summaries, *s)
	}

	return &GraphResponse{
		Points: points,
		Users:  summaries,
	}, nil
}
