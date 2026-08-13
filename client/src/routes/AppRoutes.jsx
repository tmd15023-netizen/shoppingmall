import { Routes, Route } from 'react-router-dom'
import Layout from '../components/Layout'
import Home from '../pages/Home'
import Register from '../pages/Register'
import Login from '../pages/Login'
import Admin from '../pages/Admin'
import ProductDetail from '../pages/ProductDetail'
import Cart from '../pages/Cart'
import Checkout from '../pages/Checkout'
import OrderComplete from '../pages/OrderComplete'
import OrderFail from '../pages/OrderFail'
import MyOrders from '../pages/MyOrders'
import OrderDetail from '../pages/OrderDetail'

function AppRoutes() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<Home />} />
        <Route path="/product/:id" element={<ProductDetail />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/order-complete/:id" element={<OrderComplete />} />
        <Route path="/order-fail" element={<OrderFail />} />
        <Route path="/orders" element={<MyOrders />} />
        <Route path="/orders/:id" element={<OrderDetail />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={<Admin />} />
      </Route>
      <Route path="/register" element={<Register />} />
    </Routes>
  )
}

export default AppRoutes
