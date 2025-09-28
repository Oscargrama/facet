import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import StatsCard from "@/components/StatsCard";
import Navbar from "@/components/Navbar";
import {
  CreditCard,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Plus,
  Eye,
  Calendar,
  DollarSign
} from "lucide-react";

// Mock data for demonstration
const stats = [
  {
    title: "Total Applications",
    value: "247",
    change: "+12%",
    changeType: "positive" as const,
    icon: CreditCard,
    description: "vs last month"
  },
  {
    title: "Approved Credits",
    value: "189",
    change: "+8%",
    changeType: "positive" as const,
    icon: CheckCircle,
    description: "vs last month"
  },
  {
    title: "Pending Review",
    value: "23",
    change: "-15%",
    changeType: "positive" as const,
    icon: Clock,
    description: "vs last month"
  },
  {
    title: "Total Value",
    value: "$1.2M",
    change: "+22%",
    changeType: "positive" as const,
    icon: DollarSign,
    description: "vs last month"
  }
];

const recentApplications = [
  {
    id: "APP-001",
    customer: "John Smith",
    amount: "$15,000",
    status: "approved",
    date: "2024-01-15",
    risk: "Low"
  },
  {
    id: "APP-002", 
    customer: "Sarah Johnson",
    amount: "$8,500",
    status: "pending",
    date: "2024-01-14",
    risk: "Medium"
  },
  {
    id: "APP-003",
    customer: "Mike Chen", 
    amount: "$22,000",
    status: "approved",
    date: "2024-01-14",
    risk: "Low"
  },
  {
    id: "APP-004",
    customer: "Emily Davis",
    amount: "$12,000",
    status: "denied",
    date: "2024-01-13",
    risk: "High"
  }
];

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="container-professional py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-display">Dashboard</h1>
            <p className="text-body text-muted-foreground mt-1">
              Overview of your credit applications and performance
            </p>
          </div>
          <div className="mt-4 md:mt-0">
            <Link to="/credit-application">
              <Button className="btn-primary">
                <Plus className="w-4 h-4 mr-2" />
                New Application
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <StatsCard key={index} {...stat} />
          ))}
        </div>

        {/* Recent Applications */}
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="card-professional p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-heading">Recent Applications</h2>
                <Link to="/applications">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-2" />
                    View All
                  </Button>
                </Link>
              </div>
              
              <div className="space-y-4">
                {recentApplications.map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors">
                    <div className="flex-1">
                      <div className="flex items-center space-x-4">
                        <div>
                          <p className="font-medium text-foreground">{app.customer}</p>
                          <p className="text-caption">{app.id}</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="font-semibold text-foreground">{app.amount}</p>
                          <p className="text-caption">Credit Amount</p>
                        </div>
                        <div className="hidden md:block">
                          <p className="text-caption">Risk: {app.risk}</p>
                          <p className="text-caption">{app.date}</p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                        app.status === "approved" 
                          ? "status-approved"
                          : app.status === "pending"
                          ? "status-pending" 
                          : "status-denied"
                      }`}>
                        {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="space-y-6">
            <div className="card-professional p-6">
              <h3 className="text-heading mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Link to="/credit-application">
                  <Button variant="outline" className="w-full justify-start">
                    <Plus className="w-4 h-4 mr-3" />
                    New Credit Application
                  </Button>
                </Link>
                <Link to="/risk-assessment">
                  <Button variant="outline" className="w-full justify-start">
                    <TrendingUp className="w-4 h-4 mr-3" />
                    Risk Assessment
                  </Button>
                </Link>
                <Link to="/payment-history">
                  <Button variant="outline" className="w-full justify-start">
                    <Calendar className="w-4 h-4 mr-3" />
                    Payment History
                  </Button>
                </Link>
              </div>
            </div>

            <div className="card-professional p-6">
              <h3 className="text-heading mb-4">System Status</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-body">Risk Engine</span>
                  <span className="status-approved">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body">Contract Generator</span>
                  <span className="status-approved">Active</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-body">Payment Tracker</span>
                  <span className="status-approved">Active</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}