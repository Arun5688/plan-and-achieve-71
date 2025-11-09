import { useNavigate } from "react-router-dom";
import { Shield, UserSearch, UserCog } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const LoginSelection = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-crd-navy to-background p-4">
      <div className="w-full max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-4">
            <div className="rounded-xl bg-primary p-4 shadow-glow-blue">
              <Shield className="h-16 w-16 text-primary-foreground" />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            <span className="font-mono text-primary">CRD</span> System
          </h1>
          <p className="text-xl text-muted-foreground">Crime Rate Detector</p>
          <p className="text-sm text-muted-foreground mt-2">
            Voice-Driven NLP Investigation Platform
          </p>
        </div>

        {/* Login Options */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Investigator Login */}
          <Card className="p-8 hover:border-primary transition-all duration-300 cursor-pointer group"
                onClick={() => navigate("/auth")}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-lg bg-primary/10 p-4 group-hover:bg-primary/20 transition-colors">
                  <UserSearch className="h-12 w-12 text-primary" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Investigator</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Access case search, voice commands, and investigation tools
                </p>
              </div>
              <Button 
                variant="default" 
                size="lg" 
                className="w-full"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/auth");
                }}
              >
                Investigator Login
              </Button>
            </div>
          </Card>

          {/* Admin Login */}
          <Card className="p-8 hover:border-accent transition-all duration-300 cursor-pointer group"
                onClick={() => navigate("/auth")}>
            <div className="text-center space-y-4">
              <div className="flex justify-center">
                <div className="rounded-lg bg-accent/10 p-4 group-hover:bg-accent/20 transition-colors">
                  <UserCog className="h-12 w-12 text-accent" />
                </div>
              </div>
              <div>
                <h2 className="text-2xl font-semibold mb-2">Administrator</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  Manage data, users, workflows, and system configuration
                </p>
              </div>
              <Button 
                variant="outline" 
                size="lg" 
                className="w-full border-accent text-accent hover:bg-accent hover:text-accent-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  navigate("/auth");
                }}
              >
                Administrator Login
              </Button>
            </div>
          </Card>
        </div>

        {/* Security Notice */}
        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            🔒 Secure Multi-Factor Authentication Required | All Access Logged
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginSelection;
