package main

import (
	"log"
	"math/rand"
	"time"
	"net/http"
	"github.com/gorilla/websocket"
	"backend/managers"
	"github.com/gin-gonic/gin"
)

func main() {
	// Initialize a new UserManager
	userManager := manager.NewUserManager()

	// Set up WebSocket server
	upgrader := websocket.Upgrader{
		CheckOrigin: func(r *http.Request) bool {
			// Allow connections from any origin
			return true
		},
	}

	r := gin.Default()

	r.GET("/", func(c *gin.Context) {
		conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}
		userID := generateRandomID()
		userManager.AddUser("randomName", conn, userID)
	})

	err := r.Run(":6969")
	if err != nil {
		log.Fatalf("Error starting server: %v", err)
	}
}


// generateRandomID generates a random 8-character ID for the user
func generateRandomID() string {
	src := rand.NewSource(time.Now().UnixNano())
	r := rand.New(src)
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
	b := make([]rune, 8)

	for i := range b {
		b[i] = letters[r.Intn(len(letters))]
	}
	return string(b)
}
