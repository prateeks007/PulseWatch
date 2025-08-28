package services

import (
	"crypto/tls"
	"fmt"
	"net"
	"net/url"
	"strings"
	"time"

	"github.com/prateeks007/PulseWatch/monitor/backend/models"
)

type SSLService struct{}

func NewSSLService() *SSLService { return &SSLService{} }

func (s *SSLService) Check(hostURL string) (*models.SSLInfo, error) {
	u, err := url.Parse(hostURL)
	if err != nil || u.Host == "" {
		return nil, fmt.Errorf("invalid url")
	}
	host := u.Host
	if !strings.Contains(host, ":") {
		host = host + ":443"
	}
	dialer := &net.Dialer{Timeout: 10 * time.Second}
	conn, err := tls.DialWithDialer(dialer, "tcp", host, &tls.Config{
		ServerName: strings.Split(u.Host, ":")[0],
	})
	if err != nil {
		return &models.SSLInfo{
			Host:      u.Host,
			Error:     err.Error(),
			CheckedAt: time.Now().Unix(),
		}, nil
	}
	defer conn.Close()

	cs := conn.ConnectionState()
	if len(cs.PeerCertificates) == 0 {
		return &models.SSLInfo{
			Host:      u.Host,
			Error:     "no peer certificates",
			CheckedAt: time.Now().Unix(),
		}, nil
	}
	cert := cs.PeerCertificates[0]
	validFrom := cert.NotBefore.Unix()
	validTo := cert.NotAfter.Unix()
	daysLeft := int(time.Until(cert.NotAfter).Hours() / 24)

	issuer := cert.Issuer.CommonName
	if issuer == "" {
		issuer = cert.Issuer.String()
	}

	return &models.SSLInfo{
		Host:      u.Host,
		ValidFrom: validFrom,
		ValidTo:   validTo,
		Issuer:    issuer,
		CheckedAt: time.Now().Unix(),
		DaysLeft:  daysLeft,
	}, nil
}
