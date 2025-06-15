// UI Manager Classes for Better Separation of Concerns

class ChatManager {
  constructor() {
    this.chatHistory = [];
    this.maxHistorySize = 1000;
  }
  
  addMessage(content, sender, type) {
    const message = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      content,
      sender,
      type,
      timestamp: new Date().toISOString()
    };
    
    this.chatHistory.push(message);
    
    // Limit history size
    if (this.chatHistory.length > this.maxHistorySize) {
      this.chatHistory = this.chatHistory.slice(-this.maxHistorySize);
    }
    
    return message;
  }
  
  getHistory(limit = null) {
    if (limit) {
      return this.chatHistory.slice(-limit);
    }
    return [...this.chatHistory];
  }
  
  clearHistory() {
    this.chatHistory = [];
  }
  
  cleanup() {
    this.chatHistory = [];
  }
}

class ReasoningManager {
  constructor() {
    this.reasoningSteps = [];
    this.maxSteps = 500;
  }
  
  addStep(step) {
    const enhancedStep = {
      ...step,
      id: `step-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: step.timestamp || new Date().toISOString()
    };
    
    this.reasoningSteps.push(enhancedStep);
    
    // Limit steps
    if (this.reasoningSteps.length > this.maxSteps) {
      this.reasoningSteps = this.reasoningSteps.slice(-this.maxSteps);
    }
    
    return enhancedStep;
  }
  
  getSteps() {
    return [...this.reasoningSteps];
  }
  
  clearSteps() {
    this.reasoningSteps = [];
  }
  
  cleanup() {
    this.reasoningSteps = [];
  }
}

class TaskBoardManager {
  constructor() {
    this.taskBoard = {
      pending: [],
      doing: [],
      done: []
    };
    this.maxTasksPerColumn = 100;
  }
  
  addTask(task, column = 'pending') {
    const enhancedTask = {
      ...task,
      id: task.id || `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: task.timestamp || new Date().toISOString()
    };
    
    if (this.taskBoard[column]) {
      this.taskBoard[column].push(enhancedTask);
      
      // Limit tasks per column
      if (this.taskBoard[column].length > this.maxTasksPerColumn) {
        this.taskBoard[column] = this.taskBoard[column].slice(-this.maxTasksPerColumn);
      }
    }
    
    return enhancedTask;
  }
  
  moveTask(taskId, fromColumn, toColumn) {
    const taskIndex = this.taskBoard[fromColumn]?.findIndex(t => t.id === taskId);
    if (taskIndex > -1) {
      const [task] = this.taskBoard[fromColumn].splice(taskIndex, 1);
      this.taskBoard[toColumn].push(task);
      return task;
    }
    return null;
  }
  
  getTasks(column = null) {
    if (column) {
      return [...(this.taskBoard[column] || [])];
    }
    return {
      pending: [...this.taskBoard.pending],
      doing: [...this.taskBoard.doing],
      done: [...this.taskBoard.done]
    };
  }
  
  clearBoard() {
    this.taskBoard = {
      pending: [],
      doing: [],
      done: []
    };
  }
  
  cleanup() {
    this.clearBoard();
  }
}

class SettingsManager {
  constructor() {
    this.settings = {
      theme: 'light',
      efficiencyMode: 'middle',
      highRiskToolsEnabled: false,
      language: 'ja',
      autoSave: true,
      notifications: true
    };
    this.observers = [];
  }
  
  get(key) {
    return key ? this.settings[key] : { ...this.settings };
  }
  
  set(key, value) {
    const oldValue = this.settings[key];
    this.settings[key] = value;
    
    // Notify observers
    this.notifyObservers(key, value, oldValue);
  }
  
  update(updates) {
    Object.entries(updates).forEach(([key, value]) => {
      this.set(key, value);
    });
  }
  
  subscribe(callback) {
    this.observers.push(callback);
    return () => {
      const index = this.observers.indexOf(callback);
      if (index > -1) {
        this.observers.splice(index, 1);
      }
    };
  }
  
  notifyObservers(key, newValue, oldValue) {
    this.observers.forEach(callback => {
      try {
        callback(key, newValue, oldValue);
      } catch (error) {
        console.error('Settings observer error:', error);
      }
    });
  }
  
  cleanup() {
    this.observers = [];
  }
}

class NotificationManager {
  constructor() {
    this.notifications = [];
    this.maxNotifications = 5;
  }
  
  create(message, type, options) {
    const notification = {
      id: `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      message,
      type,
      options,
      timestamp: new Date().toISOString()
    };
    
    this.notifications.push(notification);
    
    // Limit notifications
    if (this.notifications.length > this.maxNotifications) {
      const removed = this.notifications.shift();
      if (removed.element && removed.element.parentElement) {
        removed.element.remove();
      }
    }
    
    return notification;
  }
  
  remove(notificationId) {
    const index = this.notifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      const [notification] = this.notifications.splice(index, 1);
      if (notification.element && notification.element.parentElement) {
        notification.element.remove();
      }
    }
  }
  
  clearAll() {
    this.notifications.forEach(notification => {
      if (notification.element && notification.element.parentElement) {
        notification.element.remove();
      }
    });
    this.notifications = [];
  }
  
  cleanup() {
    this.clearAll();
  }
}

// Export for use in UI
if (typeof window !== 'undefined') {
  window.ChatManager = ChatManager;
  window.ReasoningManager = ReasoningManager;
  window.TaskBoardManager = TaskBoardManager;
  window.SettingsManager = SettingsManager;
  window.NotificationManager = NotificationManager;
}