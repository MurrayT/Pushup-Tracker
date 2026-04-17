package db

import (
	"database/sql"
	"errors"
	"fmt"
	"time"
)

const referralCodeTTL = 7 * 24 * time.Hour

type ReferralCode struct {
	ReferralCode string `json:"referral_code"`
}

type ReferralCodeWithExpiry struct {
	ReferralCode string    `json:"referral_code"`
	ExpiresAt    time.Time `json:"expires_at"`
}

func (db *DB) CreateReferralCode(userID int64, code string) (*ReferralCode, error) {
	res, err := db.Exec(`INSERT INTO referral_codes (user_id, referral_code, expires_at) VALUES (?, ?, ?)`, userID, code, time.Now().Add(referralCodeTTL).Unix())

	if err != nil {
		if isUniqueErr(err) {
			return nil, ErrDuplicate
		}
		return nil, fmt.Errorf("create user: %w", err)
	}

	id, _ := res.LastInsertId()

	return db.GetReferralCodeById(id)
}

func (db *DB) GetReferralCodeById(id int64) (*ReferralCode, error) {
	r := &ReferralCode{}
	err := db.QueryRow(
		`SELECT referral_code FROM referral_codes WHERE id = ?`, id,
	).Scan(&r.ReferralCode)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get referral code by id: %w", err)
	}
	return r, nil
}

func (db *DB) GetReferralCodeByCode(code string) (*ReferralCodeWithExpiry, error) {
	r := &ReferralCodeWithExpiry{}
	err := db.QueryRow(
		`SELECT referral_code, expires_at FROM referral_codes WHERE referral_code = ?`, code,
	).Scan(&r.ReferralCode, &r.ExpiresAt)
	if errors.Is(err, sql.ErrNoRows) {
		return nil, ErrNotFound
	}
	if err != nil {
		return nil, fmt.Errorf("get referral code by code: %w", err)
	}
	return r, nil
}
