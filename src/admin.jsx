import React from 'react'
import ReactDOM from 'react-dom/client'
import AdminApp from './AdminApp.jsx'
import { BrowserRouter } from 'react-router-dom'

// 后台管理入口
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter basename="/admin">
      <AdminApp />
    </BrowserRouter>
  </React.StrictMode>
)