import React, { useState } from 'react';
import { Search, Eye, Truck, CheckCircle, XCircle, DollarSign, Package, X, Save } from 'lucide-react';
import { Order } from '../types';
import { ordersAPI } from '../services/supabase';

interface OrdersManagerProps {
  orders: Order[];
  onOrdersUpdate: (orders: Order[]) => void;
}

const OrdersManager: React.FC<OrdersManagerProps> = ({ orders, onOrdersUpdate }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' | 'CANCELLED'>('ALL');

  // 筛选订单
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      (order.orderNumber || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerEmail || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'ALL' || order.orderStatus === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // 状态颜色
  const getStatusColor = (status: Order['orderStatus']) => {
    switch(status) {
      case 'PENDING': return 'text-yellow-500 border-yellow-500';
      case 'PROCESSING': return 'text-blue-500 border-blue-500';
      case 'SHIPPED': return 'text-purple-500 border-purple-500';
      case 'DELIVERED': return 'text-green-500 border-green-500';
      case 'CANCELLED': return 'text-red-500 border-red-500';
      default: return 'text-gray-500 border-gray-500';
    }
  };

  // 支付状态颜色
  const getPaymentStatusColor = (status: Order['paymentStatus']) => {
    switch(status) {
      case 'PAID': return 'text-green-500 bg-green-500/10';
      case 'PENDING': return 'text-yellow-500 bg-yellow-500/10';
      case 'FAILED': return 'text-red-500 bg-red-500/10';
      case 'REFUNDED': return 'text-gray-500 bg-gray-500/10';
      default: return 'text-gray-500 bg-gray-500/10';
    }
  };

  // 状态文本
  const getStatusText = (status: Order['orderStatus']) => {
    const map: Record<Order['orderStatus'], string> = {
      PENDING: '待处理',
      PROCESSING: '处理中',
      SHIPPED: '已发货',
      DELIVERED: '已送达',
      CANCELLED: '已取消'
    };
    return map[status];
  };

  // 支付状态文本
  const getPaymentStatusText = (status: Order['paymentStatus']) => {
    const map: Record<Order['paymentStatus'], string> = {
      PENDING: '待支付',
      PAID: '已支付',
      FAILED: '支付失败',
      REFUNDED: '已退款'
    };
    return map[status];
  };

  // 更新订单
  const handleUpdateOrder = async (order: Order) => {
    try {
      await ordersAPI.update(order.id, order);
      onOrdersUpdate(orders.map(o => o.id === order.id ? order : o));
      setEditingOrder(null);
      setViewingOrder(order);
    } catch (error: any) {
      alert(`更新失败: ${error.message}`);
    }
  };

  // 删除订单
  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('确定删除此订单吗？此操作无法恢复。')) return;
    
    try {
      await ordersAPI.delete(orderId);
      onOrdersUpdate(orders.filter(o => o.id !== orderId));
      setViewingOrder(null);
    } catch (error: any) {
      alert(`删除失败: ${error.message}`);
    }
  };

  // 统计数据
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.orderStatus === 'PENDING').length,
    processing: orders.filter(o => o.orderStatus === 'PROCESSING').length,
    shipped: orders.filter(o => o.orderStatus === 'SHIPPED').length,
    totalRevenue: orders
      .filter(o => o.paymentStatus === 'PAID')
      .reduce((sum, o) => sum + o.total, 0)
  };

  return (
    <div className="animate-fade-in">
      {/* 统计卡片 */}
      <div className="grid grid-cols-4 gap-4 mb-8">
        <div className="bg-synth-panel border border-neon-cyan p-6 rounded-lg">
          <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">总订单数</h3>
          <div className="text-4xl font-display text-white">{stats.total}</div>
        </div>
        <div className="bg-synth-panel border border-yellow-500 p-6 rounded-lg">
          <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">待处理</h3>
          <div className="text-4xl font-display text-yellow-500">{stats.pending}</div>
        </div>
        <div className="bg-synth-panel border border-blue-500 p-6 rounded-lg">
          <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">处理中</h3>
          <div className="text-4xl font-display text-blue-500">{stats.processing}</div>
        </div>
        <div className="bg-synth-panel border border-green-500 p-6 rounded-lg">
          <h3 className="text-gray-400 text-xs uppercase font-bold mb-2">总收入</h3>
          <div className="text-2xl font-display text-green-500">${stats.totalRevenue.toFixed(2)}</div>
        </div>
      </div>

      {/* 搜索和筛选 */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-display font-bold text-white">订单管理</h1>
        <div className="flex gap-4">
          {/* 状态筛选 */}
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value as any)}
            className="bg-white/5 border border-white/20 px-4 py-2 text-white text-sm focus:border-neon-cyan outline-none rounded"
          >
            <option value="ALL">全部状态</option>
            <option value="PENDING">待处理</option>
            <option value="PROCESSING">处理中</option>
            <option value="SHIPPED">已发货</option>
            <option value="DELIVERED">已送达</option>
            <option value="CANCELLED">已取消</option>
          </select>

          {/* 搜索框 */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16}/>
            <input 
              type="text" 
              placeholder="搜索订单号或客户邮箱..." 
              className="bg-white/5 border border-white/20 pl-10 pr-4 py-2 text-white text-sm focus:border-neon-cyan outline-none w-80 rounded"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* 订单列表 */}
      <div className="bg-white/5 border border-white/10 overflow-hidden rounded-lg">
        <table className="w-full text-left">
          <thead className="bg-black/50 text-xs font-bold text-gray-400 uppercase border-b border-white/10">
            <tr>
              <th className="p-4">订单号</th>
              <th className="p-4">客户</th>
              <th className="p-4">金额</th>
              <th className="p-4">支付状态</th>
              <th className="p-4">订单状态</th>
              <th className="p-4">日期</th>
              <th className="p-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {filteredOrders.map(order => (
              <tr key={order.id} className="hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-mono text-neon-cyan font-bold">{order.orderNumber}</div>
                </td>
                <td className="p-4">
                  <div className="font-medium text-white">{order.customerName || '未提供'}</div>
                  <div className="text-xs text-gray-500">{order.customerEmail}</div>
                </td>
                <td className="p-4">
                  <div className="font-mono text-white">${order.total.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">{order.currency}</div>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-1 rounded ${getPaymentStatusColor(order.paymentStatus)}`}>
                    {getPaymentStatusText(order.paymentStatus)}
                  </span>
                </td>
                <td className="p-4">
                  <span className={`text-xs font-bold px-2 py-1 border rounded ${getStatusColor(order.orderStatus)}`}>
                    {getStatusText(order.orderStatus)}
                  </span>
                </td>
                <td className="p-4 text-sm text-gray-400">
                  {new Date(order.createdAt).toLocaleDateString('zh-CN')}
                </td>
                <td className="p-4 text-right">
                  <button 
                    onClick={() => setViewingOrder(order)}
                    className="text-gray-400 hover:text-neon-cyan text-sm font-bold transition-colors"
                  >
                    <Eye size={16} className="inline mr-1"/>
                    查看
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filteredOrders.length === 0 && (
          <div className="p-12 text-center">
            <Package size={48} className="mx-auto text-gray-600 mb-4"/>
            <p className="text-gray-500 mb-2">暂无订单</p>
            <p className="text-xs text-gray-600">订单数据会在客户完成购买后自动同步</p>
          </div>
        )}
      </div>

      {/* 订单详情弹窗 */}
      {viewingOrder && !editingOrder && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-synth-panel border-2 border-neon-cyan max-w-3xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
            {/* 头部 */}
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-display font-bold text-white mb-2">订单详情</h2>
                <p className="text-neon-cyan font-mono">{viewingOrder.orderNumber}</p>
              </div>
              <button 
                onClick={() => setViewingOrder(null)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X size={24}/>
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-6">
              {/* 状态信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-2">订单状态</label>
                  <span className={`inline-block text-sm font-bold px-3 py-1 border rounded ${getStatusColor(viewingOrder.orderStatus)}`}>
                    {getStatusText(viewingOrder.orderStatus)}
                  </span>
                </div>
                <div>
                  <label className="text-xs text-gray-400 uppercase font-bold block mb-2">支付状态</label>
                  <span className={`inline-block text-sm font-bold px-3 py-1 rounded ${getPaymentStatusColor(viewingOrder.paymentStatus)}`}>
                    {getPaymentStatusText(viewingOrder.paymentStatus)}
                  </span>
                </div>
              </div>

              {/* 客户信息 */}
              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <DollarSign size={16} className="text-neon-pink"/> 客户信息
                </h3>
                <div className="bg-white/5 p-4 rounded space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">姓名：</span>
                    <span className="text-white">{viewingOrder.customerName || '未提供'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">邮箱：</span>
                    <span className="text-white">{viewingOrder.customerEmail}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">电话：</span>
                    <span className="text-white">{viewingOrder.customerPhone || '未提供'}</span>
                  </div>
                  {viewingOrder.shippingAddress && (
                    <div className="pt-2 border-t border-white/10">
                      <div className="text-gray-400 mb-1">收货地址：</div>
                      <div className="text-white">
                        {typeof viewingOrder.shippingAddress === 'string' 
                          ? viewingOrder.shippingAddress
                          : (
                            <>
                              <div>{viewingOrder.shippingAddress.address}</div>
                              <div>{viewingOrder.shippingAddress.city}, {viewingOrder.shippingAddress.state} {viewingOrder.shippingAddress.zipCode}</div>
                              <div>{viewingOrder.shippingAddress.country}</div>
                            </>
                          )
                        }
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 商品列表 */}
              <div>
                <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                  <Package size={16} className="text-neon-cyan"/> 商品清单
                </h3>
                <div className="bg-white/5 rounded overflow-hidden">
                  {viewingOrder.items.map((item, idx) => (
                    <div key={idx} className="p-4 flex items-center gap-4 border-b border-white/10 last:border-0">
                      <img src={item.productImage} className="w-16 h-16 object-cover rounded" alt={item.productName}/>
                      <div className="flex-1">
                        <div className="text-white font-medium">{item.productName}</div>
                        <div className="text-xs text-gray-500">SKU: {item.sku}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-white font-mono">${item.price} × {item.quantity}</div>
                        <div className="text-neon-cyan font-mono font-bold">${item.subtotal.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 金额汇总 */}
              <div className="bg-white/5 p-4 rounded space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">商品小计：</span>
                  <span className="text-white font-mono">${viewingOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">运费：</span>
                  <span className="text-white font-mono">${viewingOrder.shippingFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">税费：</span>
                  <span className="text-white font-mono">${viewingOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-white/20">
                  <span className="text-white font-bold">总计：</span>
                  <span className="text-neon-cyan font-mono font-bold text-lg">${viewingOrder.total.toFixed(2)} {viewingOrder.currency}</span>
                </div>
              </div>

              {/* 物流信息 */}
              {viewingOrder.trackingNumber && (
                <div>
                  <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                    <Truck size={16} className="text-neon-purple"/> 物流信息
                  </h3>
                  <div className="bg-white/5 p-4 rounded">
                    <div className="text-sm text-gray-400 mb-1">物流单号</div>
                    <div className="text-white font-mono font-bold">{viewingOrder.trackingNumber}</div>
                  </div>
                </div>
              )}

              {/* 备注 */}
              {viewingOrder.notes && (
                <div>
                  <h3 className="text-white font-bold mb-3">订单备注</h3>
                  <div className="bg-white/5 p-4 rounded text-sm text-gray-300">
                    {viewingOrder.notes}
                  </div>
                </div>
              )}

              {/* 时间信息 */}
              <div className="text-xs text-gray-500 space-y-1">
                <div>创建时间：{new Date(viewingOrder.createdAt).toLocaleString('zh-CN')}</div>
                <div>更新时间：{new Date(viewingOrder.updatedAt).toLocaleString('zh-CN')}</div>
              </div>
            </div>

            {/* 底部操作 */}
            <div className="p-6 border-t border-white/10 flex justify-between">
              <button
                onClick={() => handleDeleteOrder(viewingOrder.id)}
                className="px-6 py-2 bg-red-500/20 border border-red-500 text-red-500 hover:bg-red-500 hover:text-white font-bold text-sm rounded transition-colors"
              >
                删除订单
              </button>
              <div className="flex gap-3">
                <button
                  onClick={() => setViewingOrder(null)}
                  className="px-6 py-2 bg-transparent border border-white/20 text-gray-400 hover:text-white hover:border-white/50 font-bold text-sm rounded transition-colors"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    setEditingOrder(viewingOrder);
                    setViewingOrder(null);
                  }}
                  className="px-6 py-2 bg-neon-cyan text-black hover:bg-white font-bold text-sm rounded transition-colors"
                >
                  编辑订单
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 编辑订单弹窗 */}
      {editingOrder && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-8">
          <div className="bg-synth-panel border-2 border-neon-purple max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-lg">
            <div className="p-6 border-b border-white/10 flex justify-between items-start">
              <h2 className="text-2xl font-display font-bold text-white">编辑订单</h2>
              <button 
                onClick={() => {
                  setEditingOrder(null);
                  setViewingOrder(orders.find(o => o.id === editingOrder.id) || null);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X size={24}/>
              </button>
            </div>

            <div className="p-6 space-y-4">
              {/* 订单状态 */}
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">订单状态</label>
                <select
                  value={editingOrder.orderStatus}
                  onChange={e => setEditingOrder({...editingOrder, orderStatus: e.target.value as any})}
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-cyan outline-none rounded"
                >
                  <option value="PENDING">待处理</option>
                  <option value="PROCESSING">处理中</option>
                  <option value="SHIPPED">已发货</option>
                  <option value="DELIVERED">已送达</option>
                  <option value="CANCELLED">已取消</option>
                </select>
              </div>

              {/* 支付状态 */}
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">支付状态</label>
                <select
                  value={editingOrder.paymentStatus}
                  onChange={e => setEditingOrder({...editingOrder, paymentStatus: e.target.value as any})}
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-cyan outline-none rounded"
                >
                  <option value="PENDING">待支付</option>
                  <option value="PAID">已支付</option>
                  <option value="FAILED">支付失败</option>
                  <option value="REFUNDED">已退款</option>
                </select>
              </div>

              {/* 物流单号 */}
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">物流单号</label>
                <input
                  type="text"
                  value={editingOrder.trackingNumber || ''}
                  onChange={e => setEditingOrder({...editingOrder, trackingNumber: e.target.value})}
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-cyan outline-none rounded"
                  placeholder="输入物流单号"
                />
              </div>

              {/* 订单备注 */}
              <div>
                <label className="block text-xs text-gray-400 uppercase font-bold mb-2">订单备注</label>
                <textarea
                  value={editingOrder.notes || ''}
                  onChange={e => setEditingOrder({...editingOrder, notes: e.target.value})}
                  className="w-full bg-black border border-white/20 p-3 text-white focus:border-neon-cyan outline-none rounded h-24"
                  placeholder="添加订单备注..."
                />
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditingOrder(null);
                  setViewingOrder(orders.find(o => o.id === editingOrder.id) || null);
                }}
                className="px-6 py-2 bg-transparent border border-white/20 text-gray-400 hover:text-white hover:border-white/50 font-bold text-sm rounded"
              >
                取消
              </button>
              <button
                onClick={() => handleUpdateOrder(editingOrder)}
                className="px-6 py-2 bg-gradient-to-r from-neon-cyan to-neon-purple text-white font-bold text-sm rounded hover:shadow-lg hover:shadow-neon-cyan/50 transition-all flex items-center gap-2"
              >
                <Save size={16}/> 保存更改
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrdersManager;
