package manager

import (
	"log"
	"math/rand"
	"sync"
	"time"
)

type Room struct {
	User1 User
	User2 User
}

type RoomManager struct {
	rooms map[string]Room
	mutex sync.Mutex
}

func NewRoomManager() *RoomManager {
	return &RoomManager{
		rooms: make(map[string]Room),
	}
}

func (rm *RoomManager) generateRoomID() string {
	src := rand.NewSource(time.Now().UnixNano())
	r := rand.New(src)
	letters := []rune("abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890")
	b := make([]rune, 8)

	for i := range b {
		b[i] = letters[r.Intn(len(letters))]
	}
	return string(b)
}

func (rm *RoomManager) CreateRoom(user1 User, user2 User) string {
	rm.mutex.Lock()
	defer rm.mutex.Unlock()

	roomID := rm.generateRoomID()
	rm.rooms[roomID] = Room{User1: user1, User2: user2}

	log.Printf("Room %s created", roomID)

	// Notify both users
	user1.Conn.WriteJSON(map[string]interface{}{
		"event":  "send-offer",
		"roomId": roomID,
	})

	user2.Conn.WriteJSON(map[string]interface{}{
		"event":  "send-offer",
		"roomId": roomID,
	})

	return roomID
}

func (rm *RoomManager) handleOffer(roomID string, sdp string, senderID string) {
	rm.mutex.Lock()
	room, exists := rm.rooms[roomID]
	rm.mutex.Unlock()

	if !exists {
		log.Printf("Room %s not found", roomID)
		return
	}

	var receivingUser *User
	if room.User1.ID == senderID {
		receivingUser = &room.User2
	} else {
		receivingUser = &room.User1
	}

	receivingUser.Conn.WriteJSON(map[string]interface{}{
		"event":  "offer",
		"sdp":    sdp,
		"roomId": roomID,
	})
}

func (rm *RoomManager) handleAnswer(roomID string, sdp string, senderID string) {
	rm.mutex.Lock()
	room, exists := rm.rooms[roomID]
	rm.mutex.Unlock()

	if !exists {
		log.Printf("Room %s not found", roomID)
		return
	}

	var receivingUser *User
	if room.User1.ID == senderID {
		receivingUser = &room.User2
	} else {
		receivingUser = &room.User1
	}

	receivingUser.Conn.WriteJSON(map[string]interface{}{
		"event":  "answer",
		"sdp":    sdp,
		"roomId": roomID,
	})
}

func (rm *RoomManager) handleIceCandidates(roomID string, senderID string, candidate map[string]interface{}, iceType string) {
	rm.mutex.Lock()
	room, exists := rm.rooms[roomID]
	rm.mutex.Unlock()

	if !exists {
		log.Printf("Room %s not found", roomID)
		return
	}

	var receivingUser *User
	if room.User1.ID == senderID {
		receivingUser = &room.User2
	} else {
		receivingUser = &room.User1
	}

	receivingUser.Conn.WriteJSON(map[string]interface{}{
		"event":     "add-ice-candidate",
		"candidate": candidate,
		"type":      iceType,
	})
}
