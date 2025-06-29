import { createContext, useContext, useState, type ReactNode } from "react"
import NotificationToast from "../components/NotificationToast"

type NotificationType = "success" | "error"

interface Notification {
  message: string
  type: NotificationType
}

interface NotificationContextProps {
  showNotification: (message: string, type: NotificationType) => void
}

const NotificationContext = createContext<NotificationContextProps | undefined>(undefined)

export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error("useNotification must be used inside a NotificationProvider")
  return context
}

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notification, setNotification] = useState<Notification | null>(null)

  const showNotification = (message: string, type: NotificationType) => {
    setNotification({ message, type })
    setTimeout(() => setNotification(null), 3000)
  }

  return (
    <NotificationContext.Provider value={{ showNotification }}>
      {children}
      {notification && <NotificationToast {...notification} />}
    </NotificationContext.Provider>
  )
}
