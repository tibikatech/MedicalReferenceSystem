import { useState } from "react";
import SearchBar from "./SearchBar";
import { MoonIcon, SunIcon, BookmarkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/components/ui/theme-provider";

interface HeaderProps {
  onSearch: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { theme, setTheme } = useTheme();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };

  return (
    <header className="bg-gray-900 border-b border-gray-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <span className="text-xl font-semibold text-blue-500">
                MedTest Reference
              </span>
            </div>
            
            <div className="ml-10 w-full max-w-lg">
              <SearchBar onSearch={onSearch} />
            </div>
          </div>
          
          <div className="flex items-center">
            <Button
              variant="ghost"
              size="icon"
              aria-label="Bookmarks"
              className="p-1 rounded-full text-gray-400 hover:text-white"
            >
              <BookmarkIcon className="h-6 w-6" />
            </Button>
            
            <Button
              variant="ghost"
              size="icon"
              aria-label="Toggle dark mode"
              onClick={toggleTheme}
              className="ml-3 p-1 rounded-full text-gray-400 hover:text-white"
            >
              {theme === "dark" ? (
                <SunIcon className="h-6 w-6" />
              ) : (
                <MoonIcon className="h-6 w-6" />
              )}
            </Button>
            
            <Button
              variant="default"
              size="sm"
              className="ml-4 inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 border-0 text-sm font-medium rounded-md text-white"
              onClick={() => setIsLoggedIn(!isLoggedIn)}
            >
              {isLoggedIn ? "Sign out" : "doctor1"}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
