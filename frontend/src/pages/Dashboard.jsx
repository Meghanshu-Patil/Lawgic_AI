import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { Scale, Paperclip, Send, Loader2, PlusCircle, FileText, Image as ImageIcon, Trash2, X, UploadCloud, Moon, Sun } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';

export default function Dashboard() {
  const navigate = useNavigate();
  const [socket, setSocket] = useState(null);
  const [chatId, setChatId] = useState(null);
  const [chats, setChats] = useState([]);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [file, setFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDragActive, setIsDragActive] = useState(false);

  // New Chat Modal State
  const [showNewChatModal, setShowNewChatModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');

  // User & Theme State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  const messagesEndRef = useRef(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        console.error("Error parsing user", e);
      }
    }
    const darkMode = localStorage.getItem('darkMode') === 'true';
    setIsDarkMode(darkMode);
    if (darkMode) {
      document.body.classList.add('dark-mode');
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', newMode);
      if (newMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
      return newMode;
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/auth');
  };

  const getInitials = () => {
    if (user?.fullName?.firstName && user?.fullName?.lastName) {
      return `${user.fullName.firstName[0]}${user.fullName.lastName[0]}`.toUpperCase();
    }
    if (user?.fullname?.firstName && user?.fullname?.lastName) {
      return `${user.fullname.firstName[0]}${user.fullname.lastName[0]}`.toUpperCase();
    }
    if (user?.email) {
      return user.email.substring(0, 2).toUpperCase();
    }
    return "U";
  };

  const getFullName = () => {
    if (user?.fullName?.firstName && user?.fullName?.lastName) {
      return `${user.fullName.firstName} ${user.fullName.lastName}`;
    }
    if (user?.fullname?.firstName && user?.fullname?.lastName) {
      return `${user.fullname.firstName} ${user.fullname.lastName}`;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return "User";
  };

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    // We assume the cookie 'Token' is sent automatically by the browser.
    // In Vite dev server, we proxy to localhost:3000 to send cookies correctly.
    // For now we connect directly.
    const newSocket = io("/", {
      withCredentials: true
    });

    newSocket.on('connect', () => {
      console.log("Socket connected");
    });

    newSocket.on('ai-response', (data) => {
      setIsTyping(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        sender: 'model',
        content: data.content
      }]);
    });

    newSocket.on('connect_error', (err) => {
      console.error("Socket error:", err);
      // Redirect to login if auth fails on socket connection
      if (err.message.includes("Authentication failed")) {
        navigate('/auth');
      }
    });

    setSocket(newSocket);

    return () => newSocket.close();
  }, [navigate]);

  const fetchChats = async () => {
    try {
      const res = await fetch('/chat');
      if (res.status === 401) {
        navigate('/auth');
        return;
      }
      const data = await res.json();
      if (res.ok) {
        setChats(data.chats);
        if (data.chats.length > 0 && !chatId) {
          setChatId(data.chats[0]._id);
        } else if (data.chats.length === 0) {
          createNewChat();
        }
      }
    } catch (err) {
      console.error("Error fetching chats", err);
    }
  };

  const fetchMessages = async (id) => {
    try {
      const res = await fetch(`/chat/${id}/messages`);
      const data = await res.json();
      if (res.ok) {
        if (data.messages.length === 0) {
          setMessages([{ id: 'welcome', sender: 'model', content: "Welcome to Lawgic AI. How may I assist you with your legal query today?" }]);
        } else {
          setMessages(data.messages);
        }
      }
    } catch (err) {
      console.error("Error fetching messages", err);
    }
  };

  useEffect(() => {
    fetchChats();
  }, []);

  useEffect(() => {
    if (chatId) {
      fetchMessages(chatId);
    }
  }, [chatId]);

  const createNewChat = async (e) => {
    if (e) e.preventDefault();
    const finalTitle = newChatTitle.trim() || "New Legal Case";

    try {
      const res = await fetch('/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: finalTitle })
      });
      const data = await res.json();
      if (res.ok) {
        setChats(prev => [data.chat, ...prev]);
        setChatId(data.chat.id);
        setMessages([{ id: 'welcome', sender: 'model', content: "Welcome to Lawgic AI. How may I assist you with your legal query today?" }]);
        setShowNewChatModal(false);
        setNewChatTitle('');
      }
    } catch (err) {
      console.error("Error creating chat", err);
    }
  };

  const deleteChat = async (e, idToDelete) => {
    e.stopPropagation(); // Prevent clicking the chat item
    if (!window.confirm("Are you sure you want to delete this case file?")) return;

    try {
      const res = await fetch(`/chat/${idToDelete}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setChats(prev => prev.filter(c => (c._id || c.id) !== idToDelete));
        if (chatId === idToDelete) {
          setChatId(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error("Error deleting chat", err);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    if (!isDragActive) setIsDragActive(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      const validTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];

      if (validTypes.includes(droppedFile.type)) {
        setFile(droppedFile);
      } else {
        alert("Invalid file type. Please upload a PDF or an Image.");
      }
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim() && !file) return;
    if (!socket || !chatId) return;

    let fileUrl = null;
    let mimeType = null;

    // 1. Upload File if present
    if (file) {
      setIsUploading(true);
      const formData = new FormData();
      formData.append('file', file);

      try {
        const uploadRes = await fetch('/upload', {
          method: 'POST',
          body: formData
        });
        const uploadData = await uploadRes.json();
        if (uploadRes.ok) {
          fileUrl = uploadData.fileUrl;
          mimeType = uploadData.mimeType;
        } else {
          alert(`Upload failed: ${uploadData.error}`);
          setIsUploading(false);
          return;
        }
      } catch (err) {
        console.error("Upload error", err);
        setIsUploading(false);
        return;
      }
      setIsUploading(false);
    }

    // 2. Add to local state
    const userMsg = {
      id: Date.now(),
      sender: 'user',
      content: input,
      fileUrl,
      mimeType,
      fileName: file ? file.name : null
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setFile(null);
    setIsTyping(true);

    // 3. Emit via socket
    socket.emit('message', {
      chatId,
      content: userMsg.content,
      fileUrl: userMsg.fileUrl,
      mimeType: userMsg.mimeType
    });
  };

  const renderFilePreview = (msg) => {
    if (!msg.fileUrl) return null;
    if (msg.mimeType?.startsWith('image/')) {
      return <img src={msg.fileUrl} alt="Uploaded" className="chat-image" />;
    }
    return (
      <div className="chat-document">
        <FileText size={20} />
        <span>View Document Attachment</span>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      {/* Formal Sidebar */}
      <aside className="sidebar glass-panel">
        <div className="sidebar-header">
          <Scale size={32} className="brand-icon" />
          <h2>Lawgic</h2>
        </div>

        <button className="btn-primary new-chat-btn" onClick={() => setShowNewChatModal(true)}>
          <PlusCircle size={18} />
          <span>New Case File</span>
        </button>

        <div className="chat-history-list">
          {chats.map(c => {
            // Backend might return _id or id depending on the query vs create response
            const cId = c._id || c.id;
            return (
              <div
                key={cId}
                className={`history-item ${chatId === cId ? 'active' : ''}`}
                onClick={() => setChatId(cId)}
              >
                <div className="history-content">
                  <span className="history-title">{c.title || 'Case File'}</span>
                  <span className="history-date">
                    {new Date(c.lastActivity || c.createdAt || Date.now()).toLocaleDateString()}
                  </span>
                </div>
                <button className="delete-chat-btn" onClick={(e) => deleteChat(e, cId)} title="Delete Case File">
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
        <div className="sidebar-footer">
          <div className="user-profile-wrapper">
            <div className="avatar">{getInitials()}</div>
            <div className="user-info">
              <span className="user-name">{getFullName()}</span>
              <span className="user-role">Lead Counsel</span>
            </div>
            <div className="user-actions">
              <button className="icon-btn" onClick={handleLogout} title="Logout"><X size={16} /></button>
              <button className="icon-btn" onClick={toggleDarkMode} title="Toggle Dark Mode">
                {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main
        className="chat-main"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragActive && (
          <div className="drag-overlay glass-panel">
            <UploadCloud size={64} className="drag-icon" />
            <h2>Drop document or image here to attach</h2>
          </div>
        )}

        <header className="chat-header glass-panel">
          <h3>Case File Reference: {chatId ? chatId.slice(-6).toUpperCase() : 'LOADING...'}</h3>
          <div className="status-indicator">
            <span className={`dot ${socket ? 'online' : 'offline'}`}></span>
            <span>{socket ? 'Counsel Available' : 'Connecting...'}</span>
          </div>
        </header>

        <div className="messages-container">
          {messages.map((msg) => (
            <div key={msg.id} className={`message-wrapper ${msg.sender}`}>
              <div className="message-bubble glass-panel">
                {renderFilePreview(msg)}
                <div className="message-content markdown-body">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {msg.content}
                  </ReactMarkdown>
                </div>
                {msg.fileName && <span className="file-tag">{msg.fileName}</span>}
              </div>
            </div>
          ))}
          {isTyping && (
            <div className="message-wrapper model">
              <div className="message-bubble glass-panel typing-indicator">
                <Loader2 className="spinner" size={20} />
                <span>Lawgic AI is analyzing...</span>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="input-area-wrapper glass-panel">
          {file && (
            <div className="file-preview-banner">
              {file.type.startsWith('image/') ? <ImageIcon size={16} /> : <FileText size={16} />}
              <span>{file.name}</span>
              <button type="button" onClick={() => setFile(null)}>×</button>
            </div>
          )}

          <form onSubmit={sendMessage} className="chat-input-form">
            <label className="attachment-btn" title="Attach Document (PDF/Image)">
              <input
                type="file"
                accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
              <Paperclip size={22} />
            </label>

            <input
              type="text"
              className="chat-input input-formal"
              placeholder="Detail your legal query or attach a document..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isUploading}
            />

            <button type="submit" className="send-btn btn-accent" disabled={isUploading || (!input.trim() && !file)}>
              {isUploading ? <Loader2 className="spinner" size={20} /> : <Send size={20} />}
            </button>
          </form>
        </div>
      </main>

      {/* New Chat Modal */}
      {showNewChatModal && (
        <div className="modal-overlay">
          <div className="modal-content glass-panel">
            <div className="modal-header">
              <h3>Create New Case File</h3>
              <button className="close-btn" onClick={() => setShowNewChatModal(false)}><X size={20} /></button>
            </div>
            <form onSubmit={createNewChat} className="modal-body">
              <label>Case File Name</label>
              <input
                type="text"
                className="input-formal"
                placeholder="e.g. Smith vs. Jones 2026"
                value={newChatTitle}
                onChange={(e) => setNewChatTitle(e.target.value)}
                autoFocus
              />
              <div className="modal-actions">
                <button type="button" className="btn-secondary" onClick={() => setShowNewChatModal(false)}>Cancel</button>
                <button type="submit" className="btn-primary">Create File</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

