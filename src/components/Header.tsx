
import React from "react";
import { NavigationMenu, NavigationMenuList, NavigationMenuItem, NavigationMenuLink } from "@/components/ui/navigation-menu";
import { MedicalCross, Github, Home, Info } from "lucide-react";
import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="w-full py-4 px-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 sticky top-0 z-10">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MedicalCross className="h-6 w-6 text-primary" />
          <span className="font-semibold text-xl">FHIR Helper Hub</span>
        </div>
        
        <NavigationMenu>
          <NavigationMenuList>
            <NavigationMenuItem>
              <Link to="/" className="flex items-center px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
                <Home className="mr-2 h-4 w-4" />
                Home
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <Link to="/about" className="flex items-center px-4 py-2 text-sm font-medium hover:text-primary transition-colors">
                <Info className="mr-2 h-4 w-4" />
                About
              </Link>
            </NavigationMenuItem>
            <NavigationMenuItem>
              <a 
                href="https://github.com" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center px-4 py-2 text-sm font-medium hover:text-primary transition-colors"
              >
                <Github className="mr-2 h-4 w-4" />
                GitHub
              </a>
            </NavigationMenuItem>
          </NavigationMenuList>
        </NavigationMenu>
      </div>
    </header>
  );
};

export default Header;
