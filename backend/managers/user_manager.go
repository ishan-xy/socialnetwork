package manager

import (
	"log"
	"sync"
	"github.com/gorilla/websocket"
)

type User struct {
	Conn *websocket.Conn
	Name string
	ID   string
}

type UserManager struct {
	users       map[string]User
	queue       []string
	roomManager *RoomManager
	mutex       sync.Mutex
}

func NewUserManager() *UserManager {
	return &UserManager{
		users:       make(map[string]User),
		queue:       []string{},
		roomManager: NewRoomManager(),
	}
}

func (um *UserManager) AddUser(name string, conn *websocket.Conn, id string) {
	um.mutex.Lock()
	defer um.mutex.Unlock()

	user := User{Name: name, Conn: conn, ID: id}
	um.users[id] = user
	um.queue = append(um.queue, id)

	um.sendEvent(conn, map[string]interface{}{
		"event": "lobby",
	})

	um.clearQueue()
	go um.initHandlers(user)
}

func (um *UserManager) RemoveUser(id string) {
	um.mutex.Lock()
	defer um.mutex.Unlock()

	delete(um.users, id)

	for i, queuedID := range um.queue {
		if queuedID == id {
			um.queue = append(um.queue[:i], um.queue[i+1:]...)
			break
		}
	}
}

func (um *UserManager) clearQueue() {
	if len(um.queue) < 2 {
		return
	}

	id1 := um.queue[len(um.queue)-1]
	id2 := um.queue[len(um.queue)-2]
	um.queue = um.queue[:len(um.queue)-2]

	user1, exists1 := um.users[id1]
	user2, exists2 := um.users[id2]

	if !exists1 || !exists2 {
		return
	}

	roomID := um.roomManager.CreateRoom(user1, user2)

	um.sendEvent(user1.Conn, map[string]interface{}{
		"event":  "room-created",
		"roomId": roomID,
	})

	um.sendEvent(user2.Conn, map[string]interface{}{
		"event":  "room-created",
		"roomId": roomID,
	})
}

func (um *UserManager) initHandlers(user User) {
	conn := user.Conn
	for {
		var message map[string]interface{}
		err := conn.ReadJSON(&message)
		if err != nil {
			log.Println("Error reading message:", err)
			um.RemoveUser(user.ID)
			return
		}

		event := message["event"]
		roomID := message["roomId"].(string)

		switch event {
		case "offer":
			sdp := message["sdp"].(string)
			um.roomManager.handleOffer(roomID, sdp, user.ID)
		case "answer":
			sdp := message["sdp"].(string)
			um.roomManager.handleAnswer(roomID, sdp, user.ID)
		case "add-ice-candidate":
			candidate := message["candidate"].(map[string]interface{})
			iceType := message["type"].(string)
			um.roomManager.handleIceCandidates(roomID, user.ID, candidate, iceType)
		}
	}
}

func (um *UserManager) sendEvent(conn *websocket.Conn, message map[string]interface{}) {
	err := conn.WriteJSON(message)
	if err != nil {
		log.Println("Error sending message:", err)
		conn.Close()
	}
}
