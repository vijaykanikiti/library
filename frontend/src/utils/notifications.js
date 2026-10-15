/**
 * LibraSpace Notification System
 * Storage key: "libraspace-notifications"
 * Max: 50 items
 * Real-time: storage events & BroadcastChannel("libraspace")
 * Safari on macOS compatible
 */

export const NOTIFICATIONS_KEY = "libraspace-notifications";
export const BROADCAST_CHANNEL_NAME = "libraspace";
export const LOCAL_NOTIF_EVENT = "libraspace-notification-event";

/**
 * Safe helper to read notifications from localStorage.
 * Always returns an array (max 50, falls back to [] on any error).
 */
export function getNotifications() {
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch (err) {
    console.warn("Error reading notifications from localStorage:", err);
    return [];
  }
}

/**
 * Filter notifications for a specific user based on targeting rules:
 * - toRole "all" goes to everyone
 * - otherwise toRole and toEmail must match the logged-in user
 * - The person who did the action must not get their own notification
 */
export function isNotificationForUser(notif, user) {
  if (!user || !notif) return false;

  const userRole = (user.role || "").toLowerCase().trim();
  const userEmail = (user.email || "").toLowerCase().trim();
  const fromEmail = (notif.fromEmail || "").toLowerCase().trim();

  // The person who performed the action must NOT receive their own notification
  if (fromEmail && userEmail && fromEmail === userEmail) {
    return false;
  }

  const toRole = (notif.toRole || "all").toLowerCase().trim();
  const toEmail = (notif.toEmail || "all").toLowerCase().trim();

  // toRole "all" goes to everyone
  if (toRole === "all") {
    if (toEmail !== "all" && toEmail !== "") {
      return toEmail === userEmail;
    }
    return true;
  }

  // otherwise toRole and toEmail must match the logged-in user
  if (toRole !== userRole) {
    return false;
  }

  if (toEmail !== "all" && toEmail !== "") {
    return toEmail === userEmail;
  }

  return true;
}

/**
 * Safely broadcast a message via BroadcastChannel if supported.
 */
function broadcast(message) {
  if (typeof BroadcastChannel !== "undefined") {
    try {
      const bc = new BroadcastChannel(BROADCAST_CHANNEL_NAME);
      bc.postMessage(message);
      setTimeout(() => {
        try {
          bc.close();
        } catch (_) {}
      }, 100);
    } catch (_) {
      // Ignore if BroadcastChannel is blocked or fails
    }
  }
}

/**
 * Safely dispatch a local custom event so current tab updates immediately.
 */
function dispatchLocal(detail) {
  if (typeof window !== "undefined") {
    try {
      window.dispatchEvent(new CustomEvent(LOCAL_NOTIF_EVENT, { detail }));
    } catch (_) {}
  }
}

/**
 * Add a notification to storage (keeps latest 50 items).
 * Schema: { id, title, body, type, toRole, toEmail, time, read } + fromEmail & message
 */
export function addNotification(notification) {
  if (!notification) return null;

  try {
    const current = getNotifications();

    const notifItem = {
      id: notification.id || `notif-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
      title: notification.title || "Library Notification",
      body: notification.body || notification.message || "",
      message: notification.body || notification.message || "", // alias for backward-compat
      type: notification.type || "system",
      toRole: notification.toRole || "all",
      toEmail: notification.toEmail || "all",
      fromEmail: notification.fromEmail || "",
      time: notification.time || "Just now",
      read: Boolean(notification.read),
      timestamp: notification.timestamp || Date.now(),
    };

    // Prepend new notification and cap at latest 50
    const updated = [notifItem, ...current].slice(0, 50);

    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    // Real-time notification: BroadcastChannel for other tabs & local CustomEvent for current tab
    broadcast({ type: "NOTIFICATION_ADDED", notification: notifItem, all: updated });
    dispatchLocal({ type: "NOTIFICATION_ADDED", notification: notifItem, all: updated });

    return notifItem;
  } catch (err) {
    console.warn("Error adding notification:", err);
    return null;
  }
}

/**
 * Mark notifications as read.
 * If user is passed, marks only their targeted notifications; otherwise marks all.
 */
export function markAllRead(user = null) {
  try {
    const current = getNotifications();
    const updated = current.map((n) => {
      if (!user || isNotificationForUser(n, user)) {
        return { ...n, read: true, unread: false };
      }
      return n;
    });

    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    broadcast({ type: "NOTIFICATIONS_UPDATED", all: updated });
    dispatchLocal({ type: "NOTIFICATIONS_UPDATED", all: updated });

    return updated;
  } catch (err) {
    console.warn("Error marking all notifications as read:", err);
    return [];
  }
}

/**
 * Clear notifications.
 * If user is passed, clears notifications meant for them; otherwise clears all.
 */
export function clearAll(user = null) {
  try {
    let updated = [];
    if (user) {
      const current = getNotifications();
      updated = current.filter((n) => !isNotificationForUser(n, user));
    }

    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    broadcast({ type: "NOTIFICATIONS_CLEARED", all: updated });
    dispatchLocal({ type: "NOTIFICATIONS_CLEARED", all: updated });

    return updated;
  } catch (err) {
    console.warn("Error clearing notifications:", err);
    return [];
  }
}

/**
 * Helper to mark a single notification as read by ID.
 */
export function markAsRead(id) {
  try {
    const current = getNotifications();
    const updated = current.map((n) => (n.id === id ? { ...n, read: true, unread: false } : n));
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    broadcast({ type: "NOTIFICATIONS_UPDATED", all: updated });
    dispatchLocal({ type: "NOTIFICATIONS_UPDATED", all: updated });

    return updated;
  } catch (err) {
    console.warn("Error marking notification as read:", err);
    return [];
  }
}

/**
 * Helper to delete a single notification by ID.
 */
export function deleteNotification(id) {
  try {
    const current = getNotifications();
    const updated = current.filter((n) => n.id !== id);
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(updated));

    broadcast({ type: "NOTIFICATIONS_UPDATED", all: updated });
    dispatchLocal({ type: "NOTIFICATIONS_UPDATED", all: updated });

    return updated;
  } catch (err) {
    console.warn("Error deleting notification:", err);
    return [];
  }
}

/**
 * Request notification permission on user gesture (click in Safari).
 * Never called on page load.
 */
export async function requestNotificationPermission() {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return "unsupported";
  }

  try {
    if (Notification.permission === "granted") {
      return "granted";
    }

    // Modern browsers return a Promise; older Safari may use callback
    let permission = Notification.permission;
    if (typeof Notification.requestPermission === "function") {
      const res = Notification.requestPermission();
      if (res && typeof res.then === "function") {
        permission = await res;
      } else {
        permission = Notification.permission;
      }
    }
    return permission || Notification.permission;
  } catch (err) {
    console.warn("Failed to request notification permission:", err);
    return Notification.permission;
  }
}

/**
 * Show a system notification if granted, otherwise returns false so caller can show in-app toast.
 */
export function showSystemNotification(title, options = {}) {
  if (typeof window === "undefined" || !("Notification" in window)) {
    return false;
  }

  if (Notification.permission === "granted") {
    try {
      new Notification(title, {
        body: options.body || options.message || "",
        icon: options.icon || "/favicon.ico",
        ...options,
      });
      return true;
    } catch (e) {
      console.warn("System notification dispatch error:", e);
      return false;
    }
  }

  return false;
}
