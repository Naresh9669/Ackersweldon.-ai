"use client"
import { SidebarProvider } from "@/components/ui/sidebar";
import { NavBar } from "@/components/components/NavBar";
import { SideBar } from "@/components/components/SideBar";
import { Suspense, useState } from "react";
import { Shield, Mail, Building2, User, Search, TrendingUp, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useRouter } from "next/navigation";

// KYC Service Card Component
function KYCServiceCard({ 
  title, 
  description, 
  icon, 
  status, 
  route, 
  features 
}: { 
  title: string; 
  description: string; 
  icon: React.ReactNode; 
  status: 'active' | 'maintenance' | 'coming-soon';
  route: string;
  features: string[];
}) {
  const router = useRouter();
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800 border-green-200';
      case 'maintenance': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'coming-soon': return 'bg-gray-100 text-gray-600 border-gray-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="w-4 h-4" />;
      case 'maintenance': return <Clock className="w-4 h-4" />;
      case 'coming-soon': return <AlertTriangle className="w-4 h-4" />;
      default: return <AlertTriangle className="w-4 h-4" />;
    }
  };

  const handleClick = () => {
    if (status === 'active') {
      router.push(route);
    }
  };

  return (
    <Card className={`h-full transition-all duration-200 hover:shadow-lg ${
      status === 'active' ? 'hover:scale-105 cursor-pointer' : 'opacity-75'
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
              {icon}
            </div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <Badge className={getStatusColor(status)}>
                {getStatusIcon(status)}
                {status === 'active' ? 'Active' : status === 'maintenance' ? 'Maintenance' : 'Coming Soon'}
              </Badge>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="mb-4 text-gray-600">
          {description}
        </CardDescription>
        
        <div className="space-y-2 mb-4">
          {features.map((feature, index) => (
            <div key={index} className="flex items-center gap-2 text-sm text-gray-600">
              <CheckCircle className="w-4 h-4 text-green-500" />
              {feature}
            </div>
          ))}
        </div>

        <Button 
          onClick={handleClick}
          disabled={status !== 'active'}
          className="w-full"
          variant={status === 'active' ? 'default' : 'secondary'}
        >
          {status === 'active' ? 'Access Service' : 
           status === 'maintenance' ? 'Under Maintenance' : 'Coming Soon'}
        </Button>
      </CardContent>
    </Card>
  );
}

function KYCMainContent() {
  const [sideMenu, setSideMenu] = useState<any[]>([]);

  const kycServices = [
    {
      title: "FINRA KYC",
      description: "Financial industry compliance verification using FINRA databases and regulatory checks.",
      icon: <TrendingUp className="w-5 h-5 text-white" />,
      status: 'active' as const,
      route: '/KYC/finra',
      features: [
        "FINRA database checks",
        "Regulatory compliance",
        "Financial background verification",
        "Industry-specific validation"
      ]
    }
  ];

  const stats = [
    { label: "Active Services", value: "2", icon: <CheckCircle className="w-5 h-5" />, color: "text-green-600" },
    { label: "Total Verifications", value: "1,247", icon: <Shield className="w-5 h-5" />, color: "text-blue-600" },
    { label: "Success Rate", value: "98.5%", icon: <TrendingUp className="w-5 h-5" />, color: "text-indigo-600" },
    { label: "Response Time", value: "< 3s", icon: <Clock className="w-5 h-5" />, color: "text-purple-600" }
  ];

  return (
    <SidebarProvider defaultOpen>
      <div className="sidebar-layout bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <SideBar title="KYC Services" key={sideMenu.length} />
        <div className="sidebar-content flex flex-col">
          <NavBar />

          <main className="main-content content-area force-full-width">
            <div className="mx-32 space-y-8">
              {/* Header */}
              <div className="text-center space-y-4">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center">
                    <Shield className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">KYC Services</h1>
                    <p className="text-xl text-gray-600">Know Your Customer Verification & Compliance</p>
                  </div>
                </div>
                <p className="text-gray-600 max-w-3xl mx-auto">
                  Professional-grade KYC verification services powered by multiple trusted sources, 
                  AI-driven risk assessment, and comprehensive compliance reporting. 
                  Ensure regulatory compliance and reduce fraud risk with our advanced verification tools.
                </p>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {stats.map((stat, index) => (
                  <Card key={index} className="text-center">
                    <CardContent className="pt-6">
                      <div className={`w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3 ${stat.color}`}>
                        {stat.icon}
                      </div>
                      <div className="text-2xl font-bold text-gray-900 mb-1">{stat.value}</div>
                      <div className="text-sm text-gray-600">{stat.label}</div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* KYC Services Grid */}
              <div>
                <h2 className="text-2xl font-bold text-gray-900 mb-6">Available Services</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {kycServices.map((service, index) => (
                    <KYCServiceCard key={index} {...service} />
                  ))}
                </div>
              </div>

              {/* Features Overview */}
              <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Shield className="w-5 h-5" />
                    Why Choose Our KYC Services?
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <CheckCircle className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-2">Multi-Source Verification</h3>
                      <p className="text-sm text-blue-700">
                        Verify information across multiple trusted sources for maximum accuracy
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <TrendingUp className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-2">AI-Powered Risk Assessment</h3>
                      <p className="text-sm text-blue-700">
                        Advanced algorithms analyze risk factors and provide intelligent recommendations
                      </p>
                    </div>
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-blue-900 mb-2">Compliance Ready</h3>
                      <p className="text-sm text-blue-700">
                        Meet regulatory requirements with comprehensive audit trails and reporting
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card>
                <CardHeader>
                  <CardTitle>Quick Actions</CardTitle>
                  <CardDescription>Get started with KYC verification quickly</CardDescription>
                </CardHeader>
                <CardContent>
                                  <div className="flex flex-wrap gap-4">
                  <Button 
                    onClick={() => window.location.href = '/KYC/finra'}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  >
                    <TrendingUp className="w-4 h-4 mr-2" />
                    Start FINRA Verification
                  </Button>
                  <Button 
                    onClick={() => window.location.href = '/KYC/general'}
                    variant="outline"
                  >
                    <Search className="w-4 h-4 mr-2" />
                    General Search
                  </Button>
                </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

export default function KYCMainPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <KYCMainContent />
    </Suspense>
  );
}
