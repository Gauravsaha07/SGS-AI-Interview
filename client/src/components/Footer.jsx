import React from "react";
import { Sparkles, Heart } from "lucide-react";

const Footer = () => {
  return (
    <footer className="mt-auto border-t border-slate-800/80 bg-slate-950 py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left text-xs text-slate-400">
          
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            </div>
            <span className="font-semibold text-slate-300">
              SGS - AI Powered Interview Practice Platform
            </span>
          </div>

          <div className="flex items-center gap-1">
            <span>Designed &amp; Developed with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 inline" />
            <span>by <strong className="text-indigo-400 font-semibold">SGS</strong></span>
          </div>

          <div>
            &copy; {new Date().getFullYear()} SGS Platform. All rights reserved.
          </div>

        </div>
      </div>
    </footer>
  );
};

export default Footer;
