import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Navbar from "@/components/Navbar";
import StatsCard from "@/components/StatsCard";
import {
  ArrowLeft,
  Search,
  Download,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Filter,
  Eye
} from "lucide-react";

// Mock payment data
const payments = [
  {
    id: "PAY-001",
    applicationId: "APP-001",
    customer: "John Smith",
    amount: 1250,
    dueDate: "2024-01-15",
    paidDate: "2024-01-14",
    status: "paid",
    method: "Bank Transfer",
    remaining: 13750
  },
  {
    id: "PAY-002",
    applicationId: "APP-002",
    customer: "Sarah Johnson",
    amount: 850,
    dueDate: "2024-01-20",
    paidDate: null,
    status: "pending",
    method: "Auto Debit",
    remaining: 7650
  },
  {
    id: "PAY-003",
    applicationId: "APP-001",
    customer: "John Smith",
    amount: 1250,
    dueDate: "2024-01-10",
    paidDate: "2024-01-09",
    status: "paid",
    method: "Bank Transfer",
    remaining: 15000
  },
  {
    id: "PAY-004",
    applicationId: "APP-003",
    customer: "Mike Chen",
    amount: 2200,
    dueDate: "2024-01-25",
    paidDate: null,
    status: "overdue",
    method: "Check",
    remaining: 19800
  },
  {
    id: "PAY-005",
    applicationId: "APP-004",
    customer: "Emily Davis",
    amount: 1000,
    dueDate: "2024-01-12",
    paidDate: "2024-01-12",
    status: "paid",
    method: "Credit Card",
    remaining: 11000
  }
];

const stats = [
  {
    title: "Total Payments Received",
    value: "$45,650",
    change: "+18%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "this month"
  },
  {
    title: "On-Time Payments",
    value: "94%",
    change: "+2%",
    changeType: "positive" as const,
    icon: CheckCircle,
    description: "vs last month"
  },
  {
    title: "Pending Payments",
    value: "12",
    change: "-8%",
    changeType: "positive" as const,
    icon: Clock,
    description: "due this month"
  },
  {
    title: "Average Payment",
    value: "$1,335",
    change: "+5%",
    changeType: "positive" as const,
    icon: TrendingUp,
    description: "monthly average"
  }
];

export default function PaymentHistory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sortBy, setSortBy] = useState("date");

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = payment.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.applicationId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         payment.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || payment.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const sortedPayments = [...filteredPayments].sort((a, b) => {
    switch (sortBy) {
      case "amount":
        return b.amount - a.amount;
      case "customer":
        return a.customer.localeCompare(b.customer);
      case "date":
      default:
        return new Date(b.dueDate).getTime() - new Date(a.dueDate).getTime();
    }
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "paid":
        return "status-approved";
      case "pending":
        return "status-pending";
      case "overdue":
        return "status-denied";
      default:
        return "status-pending";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "paid":
        return <CheckCircle className="w-4 h-4" />;
      case "pending":
        return <Clock className="w-4 h-4" />;
      case "overdue":
        return <Clock className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        {/* Header */}
        <div className="flex items-center space-x-4 mb-8">
          <Link to="/">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-display">Payment History</h1>
            <p className="text-body text-muted-foreground">
              Track and manage customer payments and outstanding balances
            </p>
          </div>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Filters */}
        <div className="card-professional p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer, application ID, or payment ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="input-professional pl-10"
                />
              </div>
            </div>
            
            <div className="flex gap-3">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Due Date</SelectItem>
                  <SelectItem value="amount">Amount</SelectItem>
                  <SelectItem value="customer">Customer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Payment List */}
        <div className="card-professional">
          <div className="p-6 border-b border-border">
            <h2 className="text-heading">Payment Records</h2>
            <p className="text-caption text-muted-foreground mt-1">
              {sortedPayments.length} payment{sortedPayments.length !== 1 ? 's' : ''} found
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left p-4 font-medium text-caption">Payment ID</th>
                  <th className="text-left p-4 font-medium text-caption">Customer</th>
                  <th className="text-left p-4 font-medium text-caption">Amount</th>
                  <th className="text-left p-4 font-medium text-caption">Due Date</th>
                  <th className="text-left p-4 font-medium text-caption">Status</th>
                  <th className="text-left p-4 font-medium text-caption">Method</th>
                  <th className="text-left p-4 font-medium text-caption">Remaining</th>
                  <th className="text-left p-4 font-medium text-caption">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedPayments.map((payment, index) => (
                  <tr key={payment.id} className={`border-b border-border hover:bg-accent/50 ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}`}>
                    <td className="p-4">
                      <div>
                        <p className="font-medium text-foreground">{payment.id}</p>
                        <p className="text-caption text-muted-foreground">{payment.applicationId}</p>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">{payment.customer}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-semibold text-foreground">${payment.amount.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-muted-foreground" />
                        <span className="text-body">{payment.dueDate}</span>
                      </div>
                      {payment.paidDate && (
                        <p className="text-caption text-muted-foreground">
                          Paid: {payment.paidDate}
                        </p>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center space-x-2">
                        <span className={`flex items-center space-x-1 ${getStatusStyle(payment.status)}`}>
                          {getStatusIcon(payment.status)}
                          <span>{payment.status.charAt(0).toUpperCase() + payment.status.slice(1)}</span>
                        </span>
                      </div>
                    </td>
                    <td className="p-4">
                      <p className="text-body">{payment.method}</p>
                    </td>
                    <td className="p-4">
                      <p className="font-medium text-foreground">${payment.remaining.toLocaleString()}</p>
                    </td>
                    <td className="p-4">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {sortedPayments.length === 0 && (
            <div className="p-8 text-center">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-6 h-6 text-muted-foreground" />
              </div>
              <p className="text-body text-muted-foreground">No payments found matching your criteria</p>
            </div>
          )}
        </div>

        {/* Summary Card */}
        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="card-professional p-6">
            <h3 className="text-heading mb-4">Payment Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-caption">Total Payments This Month</span>
                <span className="font-semibold text-foreground">$45,650</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption">Outstanding Balance</span>
                <span className="font-semibold text-foreground">$127,800</span>
              </div>
              <div className="flex justify-between">
                <span className="text-caption">Average Payment Time</span>
                <span className="font-semibold text-foreground">2.3 days early</span>
              </div>
              <div className="flex justify-between border-t border-border pt-3">
                <span className="text-caption">Collection Rate</span>
                <span className="font-semibold text-secondary">94.2%</span>
              </div>
            </div>
          </div>

          <div className="card-professional p-6">
            <h3 className="text-heading mb-4">Upcoming Payments</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Sarah Johnson</p>
                  <p className="text-caption text-muted-foreground">Due in 6 days</p>
                </div>
                <p className="font-semibold text-foreground">$850</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Mike Chen</p>
                  <p className="text-caption text-destructive">Overdue by 3 days</p>
                </div>
                <p className="font-semibold text-foreground">$2,200</p>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                <div>
                  <p className="font-medium text-foreground">Lisa Wong</p>
                  <p className="text-caption text-muted-foreground">Due in 10 days</p>
                </div>
                <p className="font-semibold text-foreground">$1,500</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}