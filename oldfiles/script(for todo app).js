// Import Firebase libraries
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
    getFirestore, collection, addDoc, onSnapshot, query, orderBy
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
    getAuth, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

import { deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

import {
    getStorage, ref, uploadBytes, getDownloadURL
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";



// === REPLACE THIS WITH YOUR CONFIG ===
const firebaseConfig = {
    apiKey: "AIzaSyDJY8-yhwaUXxHwq1ZDUeHuBvod111GRBs",
    authDomain: "todoapp-2323.firebaseapp.com",
    projectId: "todoapp-2323",
    storageBucket: "todoapp-2323.firebasestorage.app",
    messagingSenderId: "306975270721",
    appId: "1:306975270721:web:4299f83d6087cdc5f523c0",
    measurementId: "G-7NYGRYFEG3"
};




const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();

const storage = getStorage(app);

const loginBtn = document.getElementById("login-btn");
const logoutBtn = document.getElementById("logout-btn");
const userInfo = document.getElementById("user-info");
const todoList = document.getElementById("todo-list");
const todoForm = document.getElementById("todo-form");
const newTask = document.getElementById("new-task");

//Take Time Mapping
function timeAgo(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;

    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return "just now";

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours !== 1 ? 's' : ''} ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days} day${days !== 1 ? 's' : ''} ago`;

    const date = new Date(timestamp);
    return date.toLocaleDateString(); // fallback to full date
}

// 🟢 Login
loginBtn.addEventListener("click", () => {
    signInWithPopup(auth, provider);
});

// 🔴 Logout
logoutBtn.addEventListener("click", () => {
    signOut(auth);
});

// 👤 Auth state listener
onAuthStateChanged(auth, (user) => {
    if (user) {
        userInfo.textContent = `Logged in as ${user.displayName}`;
        loginBtn.style.display = "none";
        logoutBtn.style.display = "inline";
        todoForm.style.display = "block";
        console.log(`Logged in as ${user.email}`)
    } else {
        userInfo.textContent = "Not logged in";
        loginBtn.style.display = "inline";
        logoutBtn.style.display = "none";
        todoForm.style.display = "none";
    }
});

// ➕ Submit task
todoForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const task = newTask.value.trim();
    const fileInput = document.getElementById("task-image");
    const file = fileInput.files[0];

    if (task === "") return;

    try {
        let imageUrl = null;

        if (file) {
            const imageRef = ref(storage, `task-images/${Date.now()}_${file.name}`);
            const snapshot = await uploadBytes(imageRef, file);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        await addDoc(collection(db, "todos"), {
            text: task,
            createdAt: Date.now(),
            userEmail: auth.currentUser.email,
            userName: auth.currentUser.displayName,
            uid: auth.currentUser.uid,
            imageUrl: imageUrl || null
        });

        newTask.value = "";
        fileInput.value = ""; // clear file input
    } catch (err) {
        alert("Error adding task: " + err.message);
    }
});


// 📡 Real-time listener
const q = query(collection(db, "todos"), orderBy("createdAt", "desc"));
onSnapshot(q, (snapshot) => {
    todoList.innerHTML = "";

    snapshot.forEach((doc) => {
        const data = doc.data();
        const li = document.createElement("li");

        // Main task text
        const taskText = document.createElement("span");
        taskText.textContent = data.text;

        // Attribution
        const byline = document.createElement("div");
        byline.style.fontSize = "0.8em";
        byline.style.color = "#555";
        const formatted = timeAgo(data.createdAt);
        byline.textContent = `Posted by ${data.userName || data.userEmail} • ${formatted}`;

        if (data.imageUrl) {
            const img = document.createElement("img");
            img.src = data.imageUrl;
            img.alt = "Task Image";
            img.style.maxWidth = "100%";
            img.loading = "lazy";
            img.style.marginTop = "5px";
            li.appendChild(img);
        }


        // Delete button (if current user is owner)
        let deleteBtn = null;
        if (auth.currentUser && auth.currentUser.uid === data.uid) {
            deleteBtn = document.createElement("button");
            deleteBtn.textContent = "🗑 Delete";
            deleteBtn.style.marginLeft = "10px";
            deleteBtn.className = 'delete-btn'
            deleteBtn.addEventListener("click", async () => {
                if (confirm("Are you sure you want to delete this task?")) {
                    await deleteDoc(doc.ref);
                }
            });
        }

        // Compose the item
        li.appendChild(taskText);
        li.appendChild(byline);
        if (deleteBtn) li.appendChild(deleteBtn);
        todoList.appendChild(li);
    });
});

