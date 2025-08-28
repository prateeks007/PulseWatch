package models

type SSLInfo struct {
	WebsiteID string `json:"website_id" bson:"website_id"`
	Host      string `json:"host" bson:"host"`
	ValidFrom int64  `json:"valid_from" bson:"valid_from"`
	ValidTo   int64  `json:"valid_to" bson:"valid_to"`
	Issuer    string `json:"issuer" bson:"issuer"`
	Error     string `json:"error" bson:"error"`
	CheckedAt int64  `json:"checked_at" bson:"checked_at"`
	DaysLeft  int    `json:"days_left" bson:"days_left"`
}
