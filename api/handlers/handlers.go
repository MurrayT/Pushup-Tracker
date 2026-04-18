package handlers

import (
	"encoding/json"
	"errors"
	"net/http"
	"pushup-tracker/auth"
	"pushup-tracker/db"
	"pushup-tracker/middleware"
	"strconv"
	"strings"
	"time"
)

// Handler holds shared dependencies for all HTTP handlers.
type Handler struct {
	db *db.DB
}

// New creates a Handler.
func New(database *db.DB) *Handler {
	return &Handler{db: database}
}

// ── helpers ──────────────────────────────────────────────────────────────────

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func readJSON(r *http.Request, v any) error {
	d := json.NewDecoder(r.Body)
	d.DisallowUnknownFields()
	return d.Decode(v)
}

// ── Auth ──────────────────────────────────────────────────────────────────────

type registerRequest struct {
	Username     string `json:"username"`
	Password     string `json:"password"`
	ReferralCode string `json:"referral_code"`
}

// Register godoc
//
//	POST /api/auth.tsx/register
//	Body: {"username":"alice", "password":"s3cr3t", "referral_code":"shareWithMe"}
func (h *Handler) Register(w http.ResponseWriter, r *http.Request) {
	var req registerRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if strings.TrimSpace(req.Username) == "" || strings.TrimSpace(req.Password) == "" || strings.TrimSpace(req.ReferralCode) == "" {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "username, password and referral_code are required"})
		return
	}

	code, err := h.db.GetReferralCodeByCode(req.ReferralCode)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid referral code"})
		return
	}

	if code.ExpiresAt.Before(time.Now().UTC()) {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "referral code has expired"})
		return
	}

	hash, err := auth.HashPassword(req.Password)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	user, err := h.db.CreateUser(req.Username, hash)
	if errors.Is(err, db.ErrDuplicate) {
		writeJSON(w, http.StatusConflict, map[string]string{"error": "username already taken"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusCreated, map[string]any{"user": user, "token": token})
}

type loginRequest struct {
	Username string `json:"username"`
	Password string `json:"password"`
}

// Login godoc
//
//	POST /api/auth.tsx/login
//	Body: {"username":"alice","password":"s3cr3t"}
func (h *Handler) Login(w http.ResponseWriter, r *http.Request) {
	var req loginRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	user, hash, err := h.db.GetUserByUsername(req.Username)
	if errors.Is(err, db.ErrNotFound) {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	if err := auth.CheckPassword(req.Password, hash); err != nil {
		writeJSON(w, http.StatusUnauthorized, map[string]string{"error": "invalid credentials"})
		return
	}

	token, err := auth.GenerateToken(user.ID, user.Username)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, map[string]any{"user": user, "token": token})
}

// ── Users ─────────────────────────────────────────────────────────────────────

// ListUsers godoc
//
//	GET /api/users
//	Returns all users (no passwords).
func (h *Handler) ListUsers(w http.ResponseWriter, r *http.Request) {
	users, err := h.db.ListUsers()
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	if users == nil {
		users = []db.User{}
	}
	writeJSON(w, http.StatusOK, map[string]any{"users": users})
}

// ── Pushups ───────────────────────────────────────────────────────────────────

type addPushupRequest struct {
	Date  string `json:"date"` // YYYY-MM-DD; defaults to today
	Count int    `json:"count"`
}

// AddPushups godoc
//
//	POST /api/pushups
//	Body: {"date":"2024-01-15","count":50}
//	Adds (or replaces) the pushup count for the authenticated user on a given day.
func (h *Handler) AddPushups(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())

	var req addPushupRequest
	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	if req.Count <= 0 {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "count must be greater than 0"})
		return
	}

	if req.Date == "" {
		req.Date = time.Now().UTC().Format("2006-01-02")
	} else {
		if _, err := time.Parse("2006-01-02", req.Date); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "date must be in YYYY-MM-DD format"})
			return
		}
	}

	entry, err := h.db.UpsertPushups(userID, req.Date, req.Count)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, entry)
}

// GetPushups godoc
//
//	GET /api/pushups?start=2024-01-01&end=2024-01-31&user_ids=1,2
//	Returns graph-ready data for all (or selected) users.
func (h *Handler) GetPushups(w http.ResponseWriter, r *http.Request) {
	q := r.URL.Query()

	params := db.QueryParams{
		StartDate: q.Get("start"),
		EndDate:   q.Get("end"),
	}

	if raw := q.Get("user_ids"); raw != "" {
		for _, s := range strings.Split(raw, ",") {
			id, err := strconv.ParseInt(strings.TrimSpace(s), 10, 64)
			if err == nil {
				params.UserIDs = append(params.UserIDs, id)
			}
		}
	}

	resp, err := h.db.GetPushupsForGraph(params)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// GetPushupsForUser godoc
//
//	GET /api/pushups/{user_id}?start=2024-01-01&end=2024-01-31
//	Returns graph-ready data for a single user. Any authenticated user may call this.
func (h *Handler) GetPushupsForUser(w http.ResponseWriter, r *http.Request) {
	idStr := r.PathValue("user_id")
	targetID, err := strconv.ParseInt(idStr, 10, 64)
	if err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": "invalid user_id"})
		return
	}

	q := r.URL.Query()
	params := db.QueryParams{
		UserIDs:   []int64{targetID},
		StartDate: q.Get("start"),
		EndDate:   q.Get("end"),
	}

	resp, err := h.db.GetPushupsForGraph(params)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}

	writeJSON(w, http.StatusOK, resp)
}

// ── Referrals ───────────────────────────────────────────────────────────────────

type ReferralCodeRequest struct {
	ReferralCode string `json:"referralCode"`
}

// CreateReferralCode godoc
//
//	POST /api/referral
//	Body: {"referral_code":"ABC123"}
//	Creates a referral code for the authenticated user.
func (h *Handler) CreateReferralCode(w http.ResponseWriter, r *http.Request) {
	userID, _ := middleware.UserIDFromContext(r.Context())

	var req ReferralCodeRequest

	if err := readJSON(r, &req); err != nil {
		writeJSON(w, http.StatusBadRequest, map[string]string{"error": err.Error()})
		return
	}

	res, err := h.db.CreateReferralCode(userID, req.ReferralCode)
	if err != nil {
		writeJSON(w, http.StatusInternalServerError, map[string]string{"error": "internal error"})
		return
	}
	writeJSON(w, http.StatusCreated, res)

}
