package main

import (
	"log"
	"math/rand"
	"time"
	"net/http"
	"github.com/gorilla/websocket"
	"backend/managers"
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

	http.HandleFunc("/", func(w http.ResponseWriter, r *http.Request) {
		// Upgrade HTTP connection to WebSocket
		conn, err := upgrader.Upgrade(w, r, nil)
		if err != nil {
			log.Println("Upgrade error:", err)
			return
		}

		// Generate a random user ID (for demonstration)
		userID := generateRandomID()

		// Add user to UserManager
		userManager.AddUser("randomName", conn, userID)
	})

	// Start the server
	log.Println("Server started on :6969")
	if err := http.ListenAndServe(":6969", nil); err != nil {
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
