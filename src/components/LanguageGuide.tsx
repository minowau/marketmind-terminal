import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { HelpCircle, X, Globe, ChevronRight, ChevronLeft } from "lucide-react";

const content = {
  en: {
    title: "The Council Tour",
    steps: [
      {
        title: "Welcome to the Terminal",
        text: "This is your AI-powered trading command center. Let's take a quick tour of the key features.",
        selector: null // Center
      },
      {
        title: "Market Overview",
        text: "Track major indices and volatility at a glance with real-time sparklines.",
        selector: "market-indices"
      },
      {
        title: "Opportunity Radar",
        text: "AI scans 1000s of news sources to find high-impact trade setups. Blue cards are BUY, Red cards are SHORT.",
        selector: "opportunity-radar"
      },
      {
        title: "Smart Wishlist",
        text: "Star your favorite stocks to track them here. We provide custom predicted moves for everything in your list.",
        selector: "wishlist-section"
      }
    ],
    buttons: {
      next: "Next",
      prev: "Back",
      finish: "Finish",
      close: "Close"
    }
  },
  hi: {
    title: "द काउंसिल टूर",
    steps: [
      {
        title: "टर्मिनल में आपका स्वागत है",
        text: "यह आपका AI-संचालित ट्रेडिंग कमांड सेंटर है। आइए प्रमुख विशेषताओं का एक त्वरित दौरा करें।",
        selector: null
      },
      {
        title: "बाजार का अवलोकन",
        text: "रीयल-टाइम स्पार्कलिन के साथ एक नज़र में प्रमुख सूचकांकों और उतार-चढ़ाव को ट्रैक करें।",
        selector: "market-indices"
      },
      {
        title: "अपर्चुनिटी रडार",
        text: "AI उच्च-प्रभाव वाले ट्रेड सेटअप खोजने के लिए 1000 समाचार स्रोतों को स्कैन करता है। नीले कार्ड BUY हैं, लाल कार्ड SHORT हैं।",
        selector: "opportunity-radar"
      },
      {
        title: "स्मार्ट विशलिस्ट",
        text: "अपने पसंदीदा स्टॉक्स को यहाँ ट्रैक करने के लिए स्टार करें। हम आपकी सूची में सब कुछ के लिए कस्टम अनुमानित मूव्स प्रदान करते हैं।",
        selector: "wishlist-section"
      }
    ],
    buttons: {
      next: "अगला",
      prev: "पीछे",
      finish: "समाप्त",
      close: "बंद करें"
    }
  }
};

export default function LanguageGuide() {
  const [isOpen, setIsOpen] = useState(false);
  const [lang, setLang] = useState<"en" | "hi">("en");
  const [currentStep, setCurrentStep] = useState(0);
  const [coords, setCoords] = useState({ top: 0, left: 0, width: 0, height: 0 });

  const t = content[lang];
  const step = t.steps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === t.steps.length - 1;

  const updateCoords = useCallback(() => {
    if (!step.selector) {
      setCoords({ top: window.innerHeight / 2 - 100, left: window.innerWidth / 2 - 160, width: 0, height: 0 });
      return;
    }
    const el = document.getElementById(step.selector);
    if (el) {
      const rect = el.getBoundingClientRect();
      setCoords({
        top: rect.top + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
        height: rect.height
      });
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [step.selector]);

  useEffect(() => {
    if (isOpen) {
      updateCoords();
      window.addEventListener('resize', updateCoords);
    }
    return () => window.removeEventListener('resize', updateCoords);
  }, [isOpen, updateCoords]);

  const handleNext = () => {
    if (!isLastStep) setCurrentStep(currentStep + 1);
    else handleClose();
  };

  const handlePrev = () => {
    if (!isFirstStep) setCurrentStep(currentStep - 1);
  };

  const handleClose = () => {
    setIsOpen(false);
    setTimeout(() => setCurrentStep(0), 300);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all group"
      >
        <HelpCircle className="h-4 w-4 group-hover:rotate-12 transition-transform" />
        <span className="text-xs font-bold uppercase tracking-wider">Site Tour</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[100] pointer-events-none">
            {/* Backdrop with Spotlight */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-background/60 backdrop-blur-[2px] pointer-events-auto"
              style={{
                clipPath: step.selector 
                  ? `polygon(0% 0%, 0% 100%, ${coords.left}px 100%, ${coords.left}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top}px, ${coords.left + coords.width}px ${coords.top + coords.height}px, ${coords.left}px ${coords.top + coords.height}px, ${coords.left}px 100%, 100% 100%, 100% 0%)`
                  : 'none'
              }}
              onClick={handleClose}
            />

            {/* Tour Card */}
            <motion.div
              layoutId="tour-card"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: 0,
                top: step.selector ? coords.top + coords.height + 20 : window.innerHeight / 2 - 100,
                left: step.selector ? coords.left + (coords.width / 2) - 160 : window.innerWidth / 2 - 160
              }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute w-80 rounded-xl border border-primary/30 bg-card p-6 shadow-2xl pointer-events-auto z-[101]"
              style={{ position: 'fixed' }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-5 w-5 rounded bg-primary/20 flex items-center justify-center text-[10px] font-black text-primary">
                    {currentStep + 1}
                  </div>
                  <h2 className="text-xs font-black uppercase tracking-widest text-foreground">{t.title}</h2>
                </div>
                <button 
                  onClick={() => setLang(lang === "en" ? "hi" : "en")}
                  className="px-2 py-0.5 rounded bg-muted text-[9px] font-bold border border-border hover:border-primary transition-colors flex items-center gap-1.5"
                >
                  <Globe className="h-2.5 w-2.5" />
                  {lang === "en" ? "HI" : "EN"}
                </button>
              </div>

              <div className="space-y-3">
                <h3 className="text-sm font-bold text-primary">{step.title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed font-medium transition-all">
                  {step.text}
                </p>
              </div>

              <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                <div className="flex gap-1">
                  {t.steps.map((_, i) => (
                    <div key={i} className={`h-1 rounded-full transition-all ${i === currentStep ? "w-4 bg-primary" : "w-1 bg-muted"}`} />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  {!isFirstStep && (
                    <button
                      onClick={handlePrev}
                      className="p-2 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={handleNext}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-[10px] font-black uppercase tracking-widest hover:opacity-90 transition-opacity"
                  >
                    {isLastStep ? t.buttons.finish : t.buttons.next}
                    {!isLastStep && <ChevronRight className="h-3 w-3" />}
                  </button>
                </div>
              </div>

              <button 
                onClick={handleClose}
                className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground shadow-lg"
              >
                <X className="h-3 w-3" />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
