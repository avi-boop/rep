// components/RepairOrderCard.jsx
// Repair Order Card Component for Dashboard

import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Chip,
  Button,
  IconButton,
  Box,
  Divider,
  Stack
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  Notifications as NotifyIcon,
  CheckCircle as CompleteIcon,
  Assignment as AssignIcon
} from '@mui/icons-material';
import { formatDate, formatCurrency } from '../utils/formatters';

const STATUS_CONFIG = {
  pending: {
    color: 'primary',
    label: 'Pending',
    icon: '🔵'
  },
  in_progress: {
    color: 'warning',
    label: 'In Progress',
    icon: '🟡'
  },
  awaiting_parts: {
    color: 'secondary',
    label: 'Awaiting Parts',
    icon: '🟠'
  },
  completed: {
    color: 'success',
    label: 'Completed',
    icon: '🟢'
  },
  ready_for_pickup: {
    color: 'info',
    label: 'Ready for Pickup',
    icon: '⚪'
  },
  picked_up: {
    color: 'default',
    label: 'Picked Up',
    icon: '✅'
  },
  cancelled: {
    color: 'error',
    label: 'Cancelled',
    icon: '❌'
  }
};

const RepairOrderCard = ({ 
  order, 
  onView, 
  onEdit, 
  onNotify, 
  onStatusChange,
  showActions = true 
}) => {
  const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending;

  const handleQuickComplete = () => {
    if (window.confirm('Mark this repair as completed?')) {
      onStatusChange(order.id, 'completed');
    }
  };

  const handleQuickNotify = () => {
    onNotify(order.id);
  };

  return (
    <Card 
      elevation={2} 
      sx={{ 
        mb: 2,
        borderLeft: order.priority === 'urgent' ? '4px solid #ef4444' : 'none',
        '&:hover': {
          boxShadow: 4
        }
      }}
    >
      <CardContent>
        {/* Header Row */}
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6" component="div">
            {order.orderNumber}
          </Typography>
          
          <Stack direction="row" spacing={1} alignItems="center">
            {order.priority === 'urgent' && (
              <Chip 
                label="URGENT" 
                color="error" 
                size="small" 
                sx={{ fontWeight: 'bold' }}
              />
            )}
            <Chip
              label={statusConfig.label}
              color={statusConfig.color}
              icon={<span>{statusConfig.icon}</span>}
            />
          </Stack>
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Customer and Device Info */}
        <Box display="flex" justifyContent="space-between" mb={2}>
          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              Customer
            </Typography>
            <Typography variant="body1" fontWeight="500">
              👤 {order.customer.firstName} {order.customer.lastName}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              📞 {order.customer.phone}
            </Typography>
          </Box>

          <Box flex={1}>
            <Typography variant="body2" color="text.secondary">
              Device
            </Typography>
            <Typography variant="body1" fontWeight="500">
              📱 {order.device.brand} {order.device.model}
            </Typography>
            {order.deviceImei && (
              <Typography variant="caption" color="text.secondary">
                IMEI: {order.deviceImei}
              </Typography>
            )}
          </Box>
        </Box>

        {/* Repair Items */}
        <Box mb={2}>
          <Typography variant="body2" color="text.secondary" mb={1}>
            🔧 Repairs:
          </Typography>
          {order.items.map((item, index) => (
            <Box key={index} ml={2} mb={0.5}>
              <Typography variant="body2">
                • {item.repairType.name} ({item.partQuality}) - {formatCurrency(item.totalPrice)}
              </Typography>
            </Box>
          ))}
        </Box>

        <Divider sx={{ mb: 2 }} />

        {/* Footer Info */}
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box>
            <Typography variant="body2" color="text.secondary">
              Total
            </Typography>
            <Typography variant="h6" color="primary.main" fontWeight="bold">
              💰 {formatCurrency(order.finalAmount)}
            </Typography>
          </Box>

          <Box textAlign="right">
            {order.assignedTo && (
              <Typography variant="body2" color="text.secondary">
                👤 Tech: {order.technician?.username || 'Unassigned'}
              </Typography>
            )}
            <Typography variant="body2" color="text.secondary">
              📅 Expected: {formatDate(order.expectedCompletionDate)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Created: {formatDate(order.createdAt)}
            </Typography>
          </Box>
        </Box>
      </CardContent>

      {/* Actions */}
      {showActions && (
        <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
          <Stack direction="row" spacing={1}>
            <Button 
              size="small" 
              startIcon={<ViewIcon />}
              onClick={() => onView(order.id)}
            >
              View
            </Button>
            <Button 
              size="small" 
              startIcon={<EditIcon />}
              onClick={() => onEdit(order.id)}
            >
              Edit
            </Button>
          </Stack>

          <Stack direction="row" spacing={1}>
            <IconButton 
              size="small" 
              color="primary"
              onClick={() => window.open(`/receipts/${order.orderNumber}`, '_blank')}
              title="Print Receipt"
            >
              <ReceiptIcon />
            </IconButton>
            
            <IconButton 
              size="small" 
              color="info"
              onClick={handleQuickNotify}
              title="Notify Customer"
            >
              <NotifyIcon />
            </IconButton>

            {(order.status === 'in_progress' || order.status === 'awaiting_parts') && (
              <Button
                size="small"
                variant="contained"
                color="success"
                startIcon={<CompleteIcon />}
                onClick={handleQuickComplete}
              >
                Complete
              </Button>
            )}

            {order.status === 'pending' && !order.assignedTo && (
              <Button
                size="small"
                variant="outlined"
                startIcon={<AssignIcon />}
                onClick={() => onEdit(order.id)}
              >
                Assign
              </Button>
            )}
          </Stack>
        </CardActions>
      )}
    </Card>
  );
};

export default RepairOrderCard;
