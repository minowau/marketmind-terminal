import React, { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform, useSpring, useMotionValue, AnimatePresence } from "framer-motion";
import { 
  TrendingUp, 
  Zap, 
  Shield, 
  Target, 
  Brain, 
  ArrowRight, 
  Mail, 
  CheckCircle,
  Activity,
  ChevronRight,
  Globe,
  Database,
  LineChart,
  BarChart,
  PieChart,
  Cpu,
  Fingerprint,
  Radar,
  User
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

// --- Hooks ---

function useMousePosition() {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [mouseX, mouseY]);

  return { mouseX, mouseY };
}

// --- Components ---

const CustomCursor = () => {
  const { mouseX, mouseY } = useMousePosition();
  
  // Main Pointer
  const cursorX = useSpring(mouseX, { stiffness: 800, damping: 35 });
  const cursorY = useSpring(mouseY, { stiffness: 800, damping: 35 });
  
  // Ghost Trail
  const ghost1X = useSpring(mouseX, { stiffness: 200, damping: 20 });
  const ghost1Y = useSpring(mouseY, { stiffness: 200, damping: 20 });
  const ghost2X = useSpring(mouseX, { stiffness: 100, damping: 15 });
  const ghost2Y = useSpring(mouseY, { stiffness: 100, damping: 15 });
  const ghost3X = useSpring(mouseX, { stiffness: 50, damping: 10 });
  const ghost3Y = useSpring(mouseY, { stiffness: 50, damping: 10 });

  return (
    <div className="fixed inset-0 z-[9999] pointer-events-none overflow-hidden">
      {/* Ghost Dots */}
      <motion.div
        className="absolute top-0 left-0 w-8 h-8 rounded-full bg-primary/5 border border-primary/10 blur-[2px]"
        style={{ x: ghost3X, y: ghost3Y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="absolute top-0 left-0 w-6 h-6 rounded-full bg-primary/10 border border-primary/20 blur-[1px]"
        style={{ x: ghost2X, y: ghost2Y, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="absolute top-0 left-0 w-4 h-4 rounded-full bg-primary/20 border border-primary/30"
        style={{ x: ghost1X, y: ghost1Y, translateX: "-50%", translateY: "-50%" }}
      />
      
      {/* Main Pointer (Crosshair) */}
      <motion.div
        className="absolute top-0 left-0 flex items-center justify-center"
        style={{ x: cursorX, y: cursorY, translateX: "-50%", translateY: "-50%" }}
      >
        <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_10px_rgba(var(--primary),1)]" />
        <div className="absolute w-6 h-6 border-t border-l border-primary/40 -translate-x-1 -translate-y-1" />
        <div className="absolute w-6 h-6 border-b border-r border-primary/40 translate-x-1 translate-y-1" />
      </motion.div>
    </div>
  );
};

const MagneticButton = ({ children, className, onClick }: { children: React.ReactNode; className?: string; onClick?: () => void }) => {
  const { mouseX, mouseY } = useMousePosition();
  const ref = useRef<HTMLButtonElement>(null);
  
  const x = useSpring(0, { stiffness: 150, damping: 15 });
  const y = useSpring(0, { stiffness: 150, damping: 15 });

  const handleMouseMove = () => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    // Magnetic pull
    const distanceX = mouseX.get() - centerX;
    const distanceY = mouseY.get() - centerY;
    
    if (Math.abs(distanceX) < 100 && Math.abs(distanceY) < 100) {
      x.set(distanceX * 0.35);
      y.set(distanceY * 0.35);
    } else {
      x.set(0);
      y.set(0);
    }
  };

  return (
    <motion.button
      ref={ref}
      style={{ x, y }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { x.set(0); y.set(0); }}
      onClick={onClick}
      className={cn(
        "relative rounded-full px-8 py-3 font-black uppercase tracking-widest text-xs transition-colors group",
        className
      )}
    >
      <span className="relative z-10">{children}</span>
      <div className="absolute inset-0 rounded-full border border-white/10 group-hover:border-primary/50 transition-colors shadow-[0_0_20px_rgba(var(--primary),0)] group-hover:shadow-[0_0_20px_rgba(var(--primary),0.2)] bg-black/40 backdrop-blur-sm" />
    </motion.button>
  );
};

const NeuralRobot = () => {
  const { mouseX, mouseY } = useMousePosition();
  const containerRef = useRef<HTMLDivElement>(null);
  
  // High-precision tracking relative to element center
  const headRotateX = useSpring(useTransform(mouseY, (y: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return Math.max(-15, Math.min(15, (y - centerY) * -0.05));
  }), { stiffness: 150, damping: 25 });

  const headRotateY = useSpring(useTransform(mouseX, (x: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    return Math.max(-15, Math.min(15, (x - centerX) * 0.05));
  }), { stiffness: 150, damping: 25 });

  const pupilX = useSpring(useTransform(mouseX, (x: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    return Math.max(-6, Math.min(6, (x - centerX) * 0.02));
  }), { stiffness: 200, damping: 20 });

  const pupilY = useSpring(useTransform(mouseY, (y: number) => {
    if (!containerRef.current) return 0;
    const rect = containerRef.current.getBoundingClientRect();
    const centerY = rect.top + rect.height / 2;
    return Math.max(-6, Math.min(6, (y - centerY) * 0.02));
  }), { stiffness: 200, damping: 20 });

  return (
    <motion.div
      ref={containerRef}
      className="relative w-full max-w-lg aspect-square flex items-center justify-center p-8"
      style={{ perspective: "1000px" }}
    >
      {/* Glow Aura */}
      <div className="absolute inset-x-0 inset-y-0 bg-primary/5 rounded-full blur-[120px] scale-90" />
      
      {/* Robot Base / Shoulders */}
      <motion.div 
        className="absolute bottom-0 w-3/4 h-1/2 bg-gradient-to-t from-black/80 to-black/20 border-x border-t border-white/5 rounded-t-[100px] backdrop-blur-3xl z-0"
        style={{ transform: "translateZ(-40px)" }}
      />

      {/* Head Assembly */}
      <motion.div
        style={{ 
          rotateX: headRotateX, 
          rotateY: headRotateY,
          transformStyle: "preserve-3d" 
        }}
        className="relative z-10 w-64 h-80 flex items-center justify-center"
      >
        {/* The Helmet Shell */}
        <div className="absolute inset-0 bg-black/95 border border-white/10 rounded-[60px] shadow-2xl overflow-hidden shadow-primary/10">
           {/* Glass Visor */}
           <div className="absolute inset-x-2 top-8 bottom-20 bg-gradient-to-b from-white/10 to-transparent border border-white/5 rounded-[40px] flex items-center justify-center gap-12 overflow-hidden">
             {/* Scanning Line */}
             <motion.div 
               animate={{ y: ["-100%", "400%"] }} 
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute inset-x-0 h-1 bg-primary/20 blur-sm pointer-events-none" 
             />
             
             {/* Glowing Eyes */}
             {[0, 1].map(i => (
               <div key={i} className="relative w-12 h-12 rounded-full bg-black border border-primary/40 flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  {/* Pupil */}
                  <motion.div 
                    style={{ x: pupilX, y: pupilY }}
                    className="w-4 h-4 rounded-full bg-primary shadow-[0_0_15px_rgba(var(--primary),1)]"
                  >
                    <div className="absolute top-0.5 left-0.5 w-1 h-1 bg-white rounded-full opacity-60" />
                  </motion.div>
                  {/* Outer Glow Ring */}
                  <div className="absolute inset-0 rounded-full border border-primary/20 animate-pulse" />
               </div>
             ))}
           </div>
           
           {/* Mouth/Speech Port */}
           <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-16 h-1 flex gap-1 justify-center">
             {[1, 2, 3].map(i => (
               <motion.div 
                 key={i} 
                 animate={{ scaleY: [1, 2.5, 1] }} 
                 transition={{ repeat: Infinity, duration: 2, delay: i * 0.2 }}
                 className="w-1 h-full bg-primary/40 rounded-full" 
               />
             ))}
           </div>
        </div>
        
        {/* Connection Wires (Decorative) */}
        <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 flex gap-4 opacity-40">
           <div className="w-[1px] h-12 bg-primary/50" />
           <div className="w-[1px] h-12 bg-primary/30" />
           <div className="w-[1px] h-12 bg-primary/50" />
        </div>
      </motion.div>

      {/* Auxiliary Floating Orbits (Magnetic) */}
      <motion.div 
        animate={{ rotate: 360 }}
        transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
        className="absolute inset-0 z-20 pointer-events-none"
      >
        <motion.div 
           className="absolute top-0 left-1/2 -translate-x-1/2 h-6 w-6 rounded-lg bg-primary/10 border border-primary/40 backdrop-blur-md flex items-center justify-center shadow-[0_0_20px_rgba(var(--primary),0.1)]"
        >
           <Zap className="h-3 w-3 text-primary animate-pulse" />
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

const ParallaxDecorativeLayer = () => {
  const { mouseX, mouseY } = useMousePosition();
  
  return (
    <div className="fixed inset-0 pointer-events-none z-10 overflow-hidden">
      {Array.from({ length: 15 }).map((_, i) => {
        const size = 2 + Math.random() * 4;
        const depth = 0.05 + Math.random() * 0.15;
        const startX = Math.random() * 100;
        const startY = Math.random() * 100;
        
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            style={{
              left: `${startX}%`,
              top: `${startY}%`,
              x: useTransform(mouseX, x => (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * depth),
              y: useTransform(mouseY, y => (y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * depth),
              scale: size / 4,
              filter: `blur(${depth * 20}px)`
            }}
            className="absolute"
          >
            <div className="relative">
               <div className="h-4 w-4 border border-primary/20 rounded-sm rotate-45 animate-[pulse_3s_infinite]" />
               <div className="absolute inset-0 h-4 w-4 bg-primary/5 blur-md rounded-full" />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

const NeuralProcessFlow = () => {
    const { scrollYProgress: sectionProgress } = useScroll();
    
    const stages = [
        {
            title: "News Harvesting",
            subtitle: "Global Sentiment Ingest",
            description: "Our LLM-native scrapers ingest 1M+ financial data points per hour. We extract nuanced sentiment and institutional bias from professional trade desks and social cycles.",
            tech: ["GPT-4o Extraction", "Entity Linking", "Sentiment Vectors"],
            visual: <div className="h-full w-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.2)_0%,transparent_70%)] animate-pulse" />
        },
        {
            title: "Psychological Profiling",
            subtitle: "Agent-Based Simulation",
            description: "We deploy 1,240 specialized investor agents to 'react' to the parsed news. Each agent has unique biases simulating the mass-market psychological response.",
            tech: ["Behavioral Matrix", "Monte Carlo Logic", "Agent Persistence"],
            visual: <div className="flex gap-2 items-center justify-center h-full">
                        {Array.from({ length: 5 }).map((_, i) => (
                            <motion.div key={i} animate={{ height: [20, 60, 20] }} transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.2 }} className="w-1 bg-primary/40 rounded-full" />
                        ))}
                    </div>
        },
        {
            title: "Alpha Synthesis",
            subtitle: "Neural Behavioral Modeling",
            description: "The divergent reactions of all agents are aggregated through our Neural Core. We identify the 'Common Denominator' of market movement and high-conviction zones.",
            tech: ["Attention Mechanisms", "Clustering Algos", "Volatility Mapping"],
            visual: <div className="relative h-24 w-24 border border-primary/20 rounded-full animate-reverse-spin bg-primary/5" />
        },
        {
            title: "Terminal Output",
            subtitle: "Market Radar & Signals",
            description: "Actionable alpha is delivered to your terminal. Real-time signals, growth targets, and conviction scores are visualized on the Neural Radar protocol.",
            tech: ["Real-time Websockets", "Radar Visualization", "Signal Protocols"],
            visual: <div className="h-0.5 w-32 bg-gradient-to-r from-transparent via-primary to-transparent animate-pulse shadow-[0_0_20px_rgba(var(--primary),1)]" />
        }
    ];

    return (
        <section id="how-it-works" className="py-48 px-6 relative border-t border-white/5 bg-black/40">
            <div className="max-w-6xl mx-auto relative">
                {/* Connecting Neural Path */}
                <div className="absolute left-1/2 top-40 bottom-40 w-[1px] bg-gradient-to-b from-primary/30 via-primary/5 to-transparent hidden lg:block -translate-x-1/2" />

                <div className="text-center mb-32 space-y-4">
                    <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="text-[10px] font-black uppercase tracking-[0.8em] text-primary">Intelligence Protocol</motion.div>
                    <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">The <span className="text-primary italic">Neural</span> Sequence</h2>
                </div>

                <div className="space-y-48">
                    {stages.map((stage, i) => {
                        const isEven = i % 2 === 0;
                        return (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0 }}
                                whileInView={{ opacity: 1 }}
                                viewport={{ margin: "-100px" }}
                                className={`flex flex-col ${isEven ? 'lg:flex-row' : 'lg:flex-row-reverse'} items-center gap-24 lg:gap-56`}
                            >
                                {/* Visual column with parallax */}
                                <motion.div 
                                    initial={{ x: isEven ? -50 : 50, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 50, damping: 20 }}
                                    className="flex-1 w-full flex justify-center"
                                >
                                    <div className="relative w-64 h-64 lg:w-80 lg:h-80 rounded-[40px] bg-white/[0.02] border border-white/5 flex items-center justify-center group overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)]">
                                        <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                        
                                        {/* Stylized Data Visual */}
                                        <div className="relative z-10 scale-125">
                                            {stage.visual}
                                        </div>

                                        {/* Large Number Parallax Background */}
                                        <motion.div 
                                            initial={{ opacity: 0.05, x: 20 }}
                                            whileInView={{ x: 0, opacity: 0.1 }}
                                            className="absolute bottom-4 right-8 text-[120px] font-black text-white pointer-events-none select-none italic"
                                        >
                                           {i+1}
                                        </motion.div>

                                        {/* Scanning Pulse */}
                                        <motion.div 
                                            animate={{ top: ["100%", "-20%"] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                                            className="absolute left-0 right-0 h-[2px] bg-primary/20 blur-sm pointer-events-none" 
                                        />
                                    </div>
                                </motion.div>

                                {/* Content column with parallax */}
                                <motion.div 
                                    initial={{ x: isEven ? 50 : -50, opacity: 0 }}
                                    whileInView={{ x: 0, opacity: 1 }}
                                    transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.1 }}
                                    className="flex-1 space-y-8 text-center lg:text-left z-10"
                                >
                                    <div className="space-y-3">
                                        <h3 className="text-3xl md:text-5xl font-black uppercase text-white tracking-tighter leading-none italic">{stage.title}</h3>
                                        <div className="flex items-center gap-3 justify-center lg:justify-start">
                                           <div className="h-[1px] w-8 bg-primary/40" />
                                           <p className="text-[10px] font-black uppercase tracking-[0.4em] text-primary">{stage.subtitle}</p>
                                        </div>
                                    </div>
                                    
                                    <p className="text-white/40 leading-relaxed text-sm md:text-base font-medium max-w-md mx-auto lg:mx-0">
                                        {stage.description}
                                    </p>

                                    <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                                        {stage.tech.map((t, idx) => (
                                            <span key={idx} className="px-4 py-1.5 rounded-lg bg-white/[0.03] border border-white/10 text-[9px] uppercase font-black tracking-widest text-primary/40 hover:text-primary hover:border-primary/20 transition-all cursor-default">
                                                {t}
                                            </span>
                                        ))}
                                    </div>
                                </motion.div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

const NeuralParticleCloud = () => {
    const { mouseX, mouseY } = useMousePosition();
    return (
        <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-40">
            {Array.from({ length: 40 }).map((_, i) => (
                <motion.div
                    key={i}
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        x: useTransform(mouseX, x => (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * (0.05 + Math.random() * 0.1)),
                        y: useTransform(mouseY, y => (y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * (0.05 + Math.random() * 0.1)),
                    }}
                    className="absolute h-[1px] w-8 bg-gradient-to-r from-transparent via-primary/40 to-transparent rotate-45"
                />
            ))}
        </div>
    );
};

const Card = ({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) => {
  const { mouseX, mouseY } = useMousePosition();
  const ref = useRef<HTMLDivElement>(null);
  
  const rotateX = useSpring(0);
  const rotateY = useSpring(0);

  const handleMouseMove = () => {
    if (!ref.current) return;
    const { left, top, width, height } = ref.current.getBoundingClientRect();
    const centerX = left + width / 2;
    const centerY = top + height / 2;
    
    const dX = (mouseX.get() - centerX) / (width / 2);
    const dY = (mouseY.get() - centerY) / (height / 2);
    
    rotateX.set(-dY * 10);
    rotateY.set(dX * 10);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay }}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { rotateX.set(0); rotateY.set(0); }}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
      className={cn(
        "rounded-2xl border border-white/5 bg-black/40 p-6 backdrop-blur-md hover:border-white/10 transition-colors",
        className
      )}
    >
      <div style={{ transform: "translateZ(20px)" }}>
        {children}
      </div>
    </motion.div>
  );
};

// --- Sections ---

// --- Components ---

const NeuralDigit = ({ value }: { value: string }) => {
  return (
    <div className="relative h-12 w-8 bg-black/80 rounded-lg border border-primary/30 flex items-center justify-center overflow-hidden shadow-[inset_0_0_10px_rgba(var(--primary),0.2)]">
      <AnimatePresence mode="wait">
        <motion.div
          key={value}
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -20, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="text-xl font-black text-primary font-mono drop-shadow-[0_0_8px_rgba(var(--primary),0.5)]"
        >
          {value}
        </motion.div>
      </AnimatePresence>
      <div className="absolute inset-x-0 top-0 h-[4px] bg-gradient-to-b from-primary/10 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[4px] bg-gradient-to-t from-primary/10 to-transparent pointer-events-none" />
    </div>
  );
};

const NeuralCounter = ({ count, digits = 6 }: { count: number | null, digits?: number }) => {
  const countStr = count !== null ? count.toString().padStart(digits, '0') : "0".repeat(digits);
  
  return (
    <div className="flex gap-1">
      {countStr.split('').map((digit, i) => (
        <NeuralDigit key={`${i}-${digit}`} value={digit} />
      ))}
    </div>
  );
};

export default function LandingPage({ onEnter }: { onEnter: () => void }) {
  const { mouseX, mouseY } = useMousePosition();
  const [entering, setEntering] = useState(false);
  const [showPasscode, setShowPasscode] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [passcodeError, setPasscodeError] = useState(false);
  const [authEmail, setAuthEmail] = useState("");
  const [authState, setAuthState] = useState<'email' | 'otp'>('email');
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0);

  // Waitlist State
  const [waitlistName, setWaitlistName] = useState("");
  const [waitlistEmail, setWaitlistEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<{ type: 'success' | 'error', msg: string } | null>(null);
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    const fetchCount = async () => {
      try {
        const response = await fetch("http://localhost:8000/api/v1/waitlist/count");
        const data = await response.json();
        if (data.count !== undefined) {
          setWaitlistCount(data.count);
        }
      } catch (error) {
        console.error("Failed to fetch waitlist count:", error);
      }
    };
    fetchCount();
    // Refresh every 30 seconds
    const interval = setInterval(fetchCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const steps = [
    "Initializing neural core...",
    "Connecting to market firehose...",
    "Simulating 1,240 edge cases...",
    "Terminal protocol ready."
  ];

  const handleEnterClick = () => {
    setShowPasscode(true);
  };

  const scrollToWaitlist = () => {
    setShowPasscode(false);
    document.getElementById("waitlist")?.scrollIntoView({ behavior: "smooth" });
  };

  const handlePasscodeSuccess = async () => {
    setShowPasscode(false);
    setEntering(true);
    // Smooth step-through with delays
    for (let i = 0; i < steps.length; i++) {
        setLoadingStep(i);
        await new Promise(r => setTimeout(r, 600 + Math.random() * 400));
    }
    // Final cinematic pause
    await new Promise(r => setTimeout(r, 500));
    onEnter();
  };

  const handleKeypadPress = (val: string) => {
    if (passcode.length < 6 && !isAuthLoading && !passcodeError) {
      const newPasscode = passcode + val;
      setPasscode(newPasscode);
      if (newPasscode.length === 6) {
        // Small delay to let the 6th digit dot appear visually
        setTimeout(() => verifyOTP(newPasscode), 300);
      }
    }
  };

  const verifyOTP = async (code: string) => {
    setIsAuthLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail, otp_code: code })
      });
      
      if (response.ok) {
        await handlePasscodeSuccess();
      } else {
        setPasscodeError(true);
        setTimeout(() => {
          setPasscode("");
          setPasscodeError(false);
        }, 1000);
      }
    } catch (e) {
      setPasscodeError(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAuthLoading(true);
    try {
      const response = await fetch("http://localhost:8000/api/v1/auth/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: authEmail })
      });
      
      if (response.ok) {
        setAuthState('otp');
      } else {
        setPasscodeError(true);
        setTimeout(() => setPasscodeError(false), 2000);
      }
    } catch (e) {
      setPasscodeError(true);
    } finally {
      setIsAuthLoading(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!waitlistName || !waitlistEmail) return;

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch("http://localhost:8000/api/v1/waitlist/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: waitlistName, email: waitlistEmail }),
      });

      const data = await response.json();

      if (response.ok) {
        setSubmitStatus({ type: 'success', msg: "Protocol Initialized. Check your email for Terminal Access." });
        setWaitlistName("");
        setWaitlistEmail("");
      } else {
        setSubmitStatus({ type: 'error', msg: data.detail || "Authorization Failed. Please retry." });
      }
    } catch (error) {
      setSubmitStatus({ type: 'error', msg: "Network error. Remote server unreachable." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const { scrollYProgress } = useScroll();
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "20%"]);
  const gridScale = useTransform(scrollYProgress, [0, 0.5], [1, 1.1]);

  return (
    <div className="relative min-h-screen bg-black overflow-hidden font-sans selection:bg-primary/30 selection:text-white cursor-none scroll-smooth">
      <CustomCursor />
      <ParallaxDecorativeLayer />
      
      {/* Dynamic Background: Mouse & Scroll Parallax */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <motion.div 
          style={{ 
            y: backgroundY,
            scale: gridScale,
            "--mouse-x": useTransform(mouseX, x => `${x}px`), 
            "--mouse-y": useTransform(mouseY, y => `${y}px`) 
          } as any}
          className="absolute inset-0 bg-[radial-gradient(circle_at_var(--mouse-x)_var(--mouse-y),rgba(var(--primary),0.08)_0%,transparent_50%)]" 
        />
        <motion.div 
          style={{ y: backgroundY }}
          className="absolute inset-0 opacity-10 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:50px_50px]" 
        />
        
        {/* Floating Particles */}
        {Array.from({ length: 20 }).map((_, i) => (
          <motion.div
            key={i}
            className="absolute h-1 w-1 bg-primary/20 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              x: useTransform(mouseX, x => (x - window.innerWidth / 2) * (0.02 + Math.random() * 0.05)),
              y: useTransform(mouseY, y => (y - window.innerHeight / 2) * (0.02 + Math.random() * 0.05))
            }}
          />
        ))}
      </div>

      <nav className="fixed top-0 left-0 right-0 z-50 px-8 py-6 backdrop-blur-sm border-b border-white/5">
        <div className="relative max-w-[1800px] mx-auto flex items-center justify-between">
          {/* Left: Logo */}
          <div className="flex items-center gap-2 z-10">
             <div className="h-2 w-2 rounded-full bg-primary animate-pulse shadow-[0_0_10px_rgba(var(--primary),1)]" />
             <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white">MarketMind <span className="text-primary/40 italic">Terminal</span></span>
          </div>

          {/* Center: Perfectly Centered Counter */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
             <div className="hidden lg:flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-5 py-2 backdrop-blur-md pointer-events-auto">
                <NeuralCounter count={waitlistCount} digits={5} />
                <div className="h-4 w-[1px] bg-white/10 mx-2" />
                <div className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40">
                   Neural Network Live
                </div>
             </div>
          </div>

          {/* Right: Links */}
          <div className="flex items-center gap-8 z-10">
             <button onClick={() => document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">How It Works</button>
             <button onClick={() => document.getElementById('agents')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Agents</button>
             <button onClick={() => document.getElementById('radar')?.scrollIntoView({ behavior: 'smooth' })} className="hidden sm:block text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">Radar</button>
             <MagneticButton onClick={handleEnterClick} className="bg-primary hover:bg-primary/90 text-primary-foreground border-none px-6 py-2.5 text-[10px] font-black uppercase tracking-widest shadow-[0_0_20px_rgba(var(--primary),0.2)] ml-4">
                Enter Terminal
             </MagneticButton>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[95vh] flex flex-col items-center justify-center px-6 pt-40 lg:pt-32 pb-20">
        <div className="max-w-7xl w-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          
          <motion.div 
            style={{
              x: useSpring(useTransform(mouseX, x => (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.015), { stiffness: 100, damping: 30 }),
              y: useSpring(useTransform(scrollYProgress, [0, 0.2], [0, -100]), { stiffness: 100, damping: 30 }),
            } as any}
            className="space-y-6 z-10 text-center lg:text-left"
          >
            <motion.h1 
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="text-6xl md:text-8xl lg:text-9xl font-black uppercase tracking-tighter leading-[0.85] text-white transition-shadow duration-500"
               style={{
                 textShadow: useTransform(mouseX, x => {
                   const xOffset = (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.05;
                   return `${xOffset}px 0px 20px rgba(var(--primary),0.3)`;
                 })
               }}
            >
               The First AI <br/>That <span className="text-primary drop-shadow-[0_0_30px_rgba(var(--primary),1)]">Thinks</span> <br/>Like The Market
            </motion.h1>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-full px-5 py-2.5 backdrop-blur-md w-fit mx-auto lg:mx-0"
            >
              <div className="flex -space-x-2 mr-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-6 w-6 rounded-full border-2 border-black bg-primary/20 flex items-center justify-center">
                    <User className="h-3 w-3 text-primary" />
                  </div>
                ))}
              </div>
              <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">
                Network Participation Live
              </div>
            </motion.div>

            <div className="flex flex-col sm:flex-row items-center gap-6 pt-4">
              <button 
                onClick={scrollToWaitlist}
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-10 py-5 rounded-2xl text-xs font-black uppercase tracking-[0.4em] shadow-[0_0_50px_rgba(var(--primary),0.3)] hover:shadow-[0_0_80px_rgba(var(--primary),0.5)] transition-all flex items-center gap-3 group"
              >
                <span>Join Neural Registry</span>
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </motion.div>

          {/* Hero Visual: Responsive Interactive Dashboard */}
          {/* Hero Visual: 3D Robot Centered Experience */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative h-[700px] flex items-center justify-center p-12"
          >
            {/* 3D Robot Centerpiece */}
            <NeuralRobot />

            {/* Floating Parallax Dashboard Pieces (Relative to Robot) */}
            <motion.div 
              style={{
                x: useTransform(mouseX, x => (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * 0.04),
                y: useTransform(mouseY, y => (y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * 0.04),
                transform: "translateZ(100px)"
              } as any}
              className="absolute top-0 left-0 z-20 pointer-events-none"
            >
              <Card className="w-64 border-primary/20 bg-black/80 shadow-2xl">
                 <div className="flex items-center gap-2 mb-4">
                   <Activity className="h-3 w-3 text-primary" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white">Active Scan</span>
                 </div>
                 <div className="h-12 w-full bg-primary/5 rounded border border-white/5 overflow-hidden flex items-end p-1 gap-0.5">
                   {Array.from({ length: 12 }).map((_, i) => (
                     <motion.div key={i} animate={{ height: [`${20+Math.random()*60}%`, `${30+Math.random()*50}%`] }} transition={{ repeat: Infinity, duration: 1, repeatType: "reverse", delay: i*0.1 }} className="flex-1 bg-primary/30 rounded-sm" />
                   ))}
                 </div>
              </Card>
            </motion.div>

            <motion.div 
              style={{
                x: useTransform(mouseX, x => (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.02),
                y: useTransform(mouseY, y => (y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.02),
                transform: "translateZ(60px)"
              } as any}
              className="absolute bottom-10 right-0 z-20 pointer-events-none"
            >
              <Card className="w-72 border-white/10 bg-black/60 shadow-xl">
                 <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">Institutional Flow</div>
                 <div className="space-y-2">
                    {[1, 2].map(i => (
                      <div key={i} className="flex justify-between items-center text-[8px] font-black uppercase">
                        <span className="text-white/40">Node_{i*42}</span>
                        <span className="text-success">CONNECTED</span>
                      </div>
                    ))}
                 </div>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <NeuralProcessFlow />

      {/* Agents Section: The Simulations */}
      <section id="agents" className="py-32 px-6 relative border-t border-white/5">
        <div className="max-w-7xl mx-auto space-y-24">
          <div id="radar-anchor" className="text-center space-y-4">
             <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.6em] text-primary">
                <Database className="h-4 w-4" /> Behavioral Matrix
             </motion.div>
             <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-white">
               The <span className="text-primary italic">Agents</span> of Chaos
             </h2>
             <p className="text-muted-foreground text-sm uppercase tracking-widest max-w-xl mx-auto">
               We simulate 1,240+ specialized investor personas to predict the mass-market psychological response to any event.
             </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              { type: "Momentum", desc: "Chases trend velocity with high-frequency scaling. Aggressive and noise-sensitive.", icon: Activity, metric: "Risk: Extreme" },
              { type: "Conservative", desc: "Defensive positioning focusing on support floors and value signals.", icon: Shield, metric: "Risk: Minimal" },
              { type: "FOMO Retail", desc: "Emotional reactor driven by social spikes and perceived exclusivity.", icon: Zap, metric: "Risk: High" },
              { type: "Institutional", desc: "Pattern absorber managing massive liquidity blocks with silent execution.", icon: Database, metric: "Risk: Moderate" }
            ].map((agent, i) => (
              <Card key={i} className="group relative overflow-hidden" delay={i * 0.1}>
                 <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-3xl -mr-12 -mt-12 group-hover:bg-primary/20 transition-colors" />
                 
                 <div className="mb-8 h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/20 group-hover:text-primary transition-all duration-500 shadow-xl border border-white/5 group-hover:border-primary/40">
                    <agent.icon className="h-7 w-7" />
                 </div>
                 
                 <h3 className="text-2xl font-black uppercase tracking-tight text-white mb-3 flex items-center justify-between">
                   {agent.type}
                   <span className="text-[10px] font-mono text-muted-foreground/30">v4.1</span>
                 </h3>
                 <p className="text-sm text-white/50 leading-relaxed font-medium mb-8">"{agent.desc}"</p>
                 
                 <div className="space-y-4">
                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-primary/60">
                       <span>Intelligence Confidence</span>
                       <span>{(70 + Math.random() * 20).toFixed(0)}%</span>
                    </div>
                    <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                          initial={{ width: 0 }}
                          whileInView={{ width: "85%" }}
                          transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                          className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),0.5)]" 
                       />
                    </div>
                 </div>

                 <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/20 tracking-tighter">
                       {agent.metric}
                    </span>
                    <div className="flex gap-1">
                       <div className="h-1 w-1 bg-primary rounded-full animate-pulse" />
                       <div className="h-1 w-1 bg-primary rounded-full animate-pulse delay-75" />
                       <div className="h-1 w-1 bg-primary rounded-full animate-pulse delay-150" />
                    </div>
                 </div>
              </Card>
            ))}
          </div>

          <div className="py-32 flex flex-col items-center relative overflow-hidden">
             {/* Dynamic 3D Matrix Background behind button */}
             <NeuralParticleCloud />
             
             <motion.div
               style={{
                 x: useTransform(mouseX, x => (x - (typeof window !== 'undefined' ? window.innerWidth / 2 : 0)) * -0.05),
                 y: useTransform(mouseY, y => (y - (typeof window !== 'undefined' ? window.innerHeight / 2 : 0)) * -0.05),
               }}
               className="text-[10vw] font-black text-white/[0.04] select-none tracking-tighter leading-none mb-8 filter blur-[2px]"
             >
               NEURAL_SIM
             </motion.div>

             <motion.div 
               whileHover={{ scale: 1.05 }}
               whileTap={{ scale: 0.95 }}
               onClick={() => document.getElementById('radar')?.scrollIntoView({ behavior: 'smooth' })}
               className="relative flex items-center gap-4 px-10 py-5 rounded-2xl border border-primary/40 bg-primary/10 text-primary text-sm font-black uppercase tracking-[0.3em] cursor-pointer group shadow-[0_0_30px_rgba(var(--primary),0.1)] hover:shadow-[0_0_50px_rgba(var(--primary),0.3)] transition-all"
             >
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl group-hover:bg-primary/20 transition-colors" />
                <span className="relative z-10">Explore Neural Matrix</span>
                <ArrowRight className="relative z-10 h-5 w-5 group-hover:translate-x-2 transition-transform" />
             </motion.div>
          </div>
        </div>
      </section>

      {/* Radar Section */}
      <section id="radar" className="py-40 px-6 bg-black relative">
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.05)_0%,transparent_100%)]" />
         <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
            <div className="lg:col-span-5 space-y-10">
               <div className="space-y-4">
                  <h2 className="text-xs font-black uppercase tracking-[0.5em] text-primary">Opportunity Radar</h2>
                  <p className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white leading-[0.9]">Visualizing The <br/><span className="text-primary drop-shadow-[0_0_20px_rgba(var(--primary),0.3)]">Inevitability</span></p>
               </div>
               <p className="text-muted-foreground text-lg leading-relaxed font-medium lg:max-w-md">
                 Our system identifies alpha opportunities in milliseconds by connecting global news clusters to simulation results. High conviction signals are mapped through our proprietary **Decision Probability Engine**.
               </p>
               <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/5">
                     <div className="text-3xl font-black text-white">94.2%</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-primary mt-1">Prediction Precision</div>
                  </div>
                  <div className="p-6 rounded-2xl border border-white/5 bg-white/5">
                     <div className="text-3xl font-black text-white">12ms</div>
                     <div className="text-[9px] font-black uppercase tracking-widest text-primary mt-1">Detection Latency</div>
                  </div>
               </div>
            </div>

            <div className="lg:col-span-7 grid grid-cols-1 md:grid-cols-2 gap-4">
               {[
                 { symbol: "TCS", move: "+12.4%", trigger: "AI Transformation Deal", conf: "92%" },
                 { symbol: "INFY", move: "-4.2%", trigger: "Margin Compression News", conf: "88%" },
                 { symbol: "RELIANCE", move: "+5.1%", trigger: "Clean Energy Milestone", conf: "95%" },
                 { symbol: "HDFCBANK", move: "+2.8%", trigger: "Rate Cut Projection", conf: "91%" }
               ].map((signal, i) => (
                 <motion.div
                   key={i}
                   initial={{ opacity: 0, x: 20 }}
                   whileInView={{ opacity: 1, x: 0 }}
                   transition={{ delay: i * 0.1 }}
                   viewport={{ once: true }}
                   className="p-6 rounded-2xl border border-white/5 bg-black/60 hover:bg-black/80 hover:border-primary/30 transition-all cursor-crosshair group"
                 >
                    <div className="flex justify-between items-center mb-6">
                       <span className="text-lg font-black text-white tracking-tighter uppercase">{signal.symbol}</span>
                       <span className={cn("text-xs font-black uppercase tracking-widest px-2 py-0.5 rounded", signal.move.startsWith('+') ? "text-success bg-success/10 border border-success/20" : "text-destructive bg-destructive/10 border border-destructive/20")}>
                         {signal.move}
                       </span>
                    </div>
                    <div className="text-[9px] font-black uppercase text-white/30 tracking-widest mb-1 italic">Trigger Event</div>
                    <p className="text-xs font-bold text-white/70 mb-6 font-mono">protocol::{signal.trigger.toLowerCase().replace(/ /g, '_')}</p>
                    
                    <div className="flex items-center justify-between pt-4 border-t border-white/5 group-hover:border-primary/20 transition-colors">
                       <div className="text-[10px] font-black text-primary uppercase tracking-[0.2em]">{signal.conf} Confidence</div>
                       <div className="flex -space-x-1">
                          {Array.from({ length: 3 }).map((_, j) => (
                            <div key={j} className="h-4 w-4 rounded-full border border-black bg-primary/20 flex items-center justify-center text-[6px] font-black text-primary">A</div>
                          ))}
                       </div>
                    </div>
                 </motion.div>
               ))}
            </div>
         </div>
      </section>

      {/* Global Intelligence Map: Vector Web */}
      <section className="py-40 px-6 border-y border-white/5 bg-black overflow-hidden relative">
         <div className="max-w-7xl mx-auto space-y-20 relative z-10">
            <div className="text-center space-y-4">
               <h2 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white">Market <span className="text-primary italic">Web</span></h2>
               <p className="text-muted-foreground text-[10px] font-black uppercase tracking-[0.4em]">Proprietary Neural Link Topology</p>
            </div>
            
            <div className="relative h-[400px] flex items-center justify-center">
               {/* Core Node */}
               <div className="z-20 h-24 w-24 rounded-full border border-primary/50 bg-primary/10 flex items-center justify-center animate-pulse">
                  <Globe className="h-10 w-10 text-primary" />
               </div>
               
               {/* Satellite Nodes */}
               {Array.from({ length: 6 }).map((_, i) => (
                 <motion.div
                    key={i}
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear", delay: i * -3 }}
                    className="absolute z-10"
                 >
                    <div className="translate-x-[150px] sm:translate-x-[200px]">
                       <div className="h-12 w-12 rounded-xl border border-white/10 bg-black/80 flex items-center justify-center group cursor-pointer hover:border-primary/50 transition-colors">
                          <Database className="h-5 w-5 text-white/40 group-hover:text-primary transition-colors" />
                       </div>
                    </div>
                 </motion.div>
               ))}

               {/* Drawing lines to nodes (Simplified SVG) */}
               <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                  <circle cx="50%" cy="50%" r="200" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/20" />
                  <circle cx="50%" cy="50%" r="150" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-primary/10" strokeDasharray="5 5" />
               </svg>
            </div>
         </div>
      </section>

      {/* Waitlist Section */}
      <section id="waitlist" className="py-40 px-6 relative bg-black overflow-hidden">
        {/* Abstract Geometry */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-full bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.07)_0%,transparent_70%)] opacity-50" />
        
        <div className="max-w-3xl mx-auto text-center relative z-10 space-y-16">
          <div className="space-y-6">
             <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.5em] text-primary">
                <Fingerprint className="h-4 w-4" /> Secure Onboarding
             </motion.div>
             <h2 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-white leading-none">
               Get Early <br/>Access
             </h2>
              <div className="flex flex-col items-center gap-6">
                 <p className="text-muted-foreground text-[10px] uppercase tracking-[0.3em] max-w-sm mx-auto font-black italic">
                   Join the neural protocol network today.
                 </p>
              </div>
           </div>

          <form onSubmit={handleWaitlistSubmit} className="space-y-4">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <input 
                 type="text" 
                 required
                 value={waitlistName}
                 onChange={(e) => setWaitlistName(e.target.value)}
                 placeholder="NAME.IDENTITY" 
                 className="bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 text-xs font-black tracking-widest text-white uppercase focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
               />
               <input 
                 type="email" 
                 required
                 value={waitlistEmail}
                 onChange={(e) => setWaitlistEmail(e.target.value)}
                 placeholder="ACCESS@EMAIL.IO" 
                 className="bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 text-xs font-black tracking-widest text-white uppercase focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
               />
             </div>
             <motion.button 
               whileHover={{ scale: 1.02 }}
               whileTap={{ scale: 0.98 }}
               disabled={isSubmitting}
               type="submit"
               className="w-full bg-primary py-6 rounded-2xl text-primary-foreground font-black uppercase tracking-[0.4em] text-xs shadow-[0_0_40px_rgba(var(--primary),0.3)] hover:shadow-[0_0_60px_rgba(var(--primary),0.5)] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
             >
               {isSubmitting ? "Initializing..." : "Initialize Entry Request"}
             </motion.button>
             
             {submitStatus && (
               <motion.div 
                 initial={{ opacity: 0, y: 10 }}
                 animate={{ opacity: 1, y: 0 }}
                 className={cn(
                   "text-[10px] font-black uppercase tracking-widest text-center",
                   submitStatus.type === 'success' ? "text-primary" : "text-destructive"
                 )}
               >
                 {submitStatus.msg}
               </motion.div>
             )}
          </form>

          <div className="flex items-center justify-center gap-6 text-[8px] font-black uppercase tracking-[0.3em] text-white/20 italic">
             <span>Protocol Standard v2.0</span>
             <div className="h-1 w-1 bg-white/20 rounded-full" />
             <span>Neural Link Ready</span>
             <div className="h-1 w-1 bg-white/20 rounded-full" />
             <span>Data Verified</span>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-8 bg-black/80 backdrop-blur-md">
         <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white">MarketMind © 2026</span>
         </div>
         <div className="flex items-center gap-10">
            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors">Documentation</a>
            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors">Neural Policy</a>
            <a href="#" className="text-[9px] font-black uppercase tracking-widest text-white/30 hover:text-primary transition-colors">Security Node</a>
         </div>
         <div className="text-[9px] font-black uppercase tracking-widest text-white/10">
            Built for the future of finance
         </div>
      </footer>

      {/* Passcode Gate Overlay */}
      <AnimatePresence>
        {showPasscode && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-6"
          >
            <div className="max-w-xs w-full space-y-12">
                <div className="text-center space-y-4">
                   <motion.div 
                     animate={passcodeError ? { x: [-10, 10, -10, 10, 0] } : {}}
                     className="text-xs font-black uppercase tracking-[0.5em] text-primary"
                   >
                     {passcodeError ? "Authorization Denied" : "Neural Link Access"}
                   </motion.div>
                   <h2 className="text-3xl font-black uppercase tracking-tighter text-white">
                      {authState === 'email' ? "Identify Node" : "Enter Protocol"}
                   </h2>
                </div>

                {authState === 'email' ? (
                  <form onSubmit={handleRequestOTP} className="space-y-6">
                    <div className="space-y-2">
                       <div className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2">Registered Gmail</div>
                       <input 
                         type="email"
                         required
                         value={authEmail}
                         onChange={(e) => setAuthEmail(e.target.value.toLowerCase())}
                         placeholder="NODES@GMAIL.COM"
                         className="w-full bg-white/[0.03] border border-white/10 rounded-2xl px-8 py-5 text-xs font-black tracking-widest text-white uppercase focus:outline-none focus:border-primary/50 focus:bg-white/[0.05] transition-all"
                       />
                    </div>
                    <motion.button 
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      disabled={isAuthLoading}
                      type="submit"
                      className="w-full bg-primary py-5 rounded-2xl text-primary-foreground font-black uppercase tracking-[0.4em] text-xs shadow-[0_0_40px_rgba(var(--primary),0.2)] disabled:opacity-50"
                    >
                      {isAuthLoading ? "Verifying Registry..." : "Request Access Key"}
                    </motion.button>
                    
                    {passcodeError && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center pt-4">
                        <button 
                          onClick={scrollToWaitlist}
                          className="text-[9px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                        >
                          Not on the whitelist? Join the registry →
                        </button>
                      </motion.div>
                    )}
                  </form>
                ) : (
                  <div className="space-y-12">
                    {/* PIN Display */}
                    <div className="flex justify-center gap-2">
                       {[0, 1, 2, 3, 4, 5].map(i => (
                         <div key={i} className={cn(
                           "h-12 w-10 rounded-xl border-2 flex items-center justify-center transition-all duration-300",
                           passcode.length > i ? "border-primary bg-primary/10 shadow-[0_0_20px_rgba(var(--primary),0.3)]" : "border-white/10 bg-white/5",
                           passcodeError && "border-destructive/50 bg-destructive/10"
                         )}>
                           {passcode.length > i && <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />}
                         </div>
                       ))}
                    </div>

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4">
                       {["1", "2", "3", "4", "5", "6", "7", "8", "9", "CLR", "0", "DEL"].map((val) => (
                         <motion.button
                           key={val}
                           whileHover={{ scale: 1.05, backgroundColor: "rgba(255,255,255,0.05)" }}
                           whileTap={{ scale: 0.95 }}
                           onClick={() => {
                             if (val === "CLR") setPasscode("");
                             else if (val === "DEL") setPasscode(p => p.slice(0, -1));
                             else handleKeypadPress(val);
                           }}
                           className="h-16 rounded-2xl border border-white/5 bg-white/[0.02] text-sm font-black text-white hover:border-primary/20 transition-colors flex items-center justify-center"
                         >
                           {val}
                         </motion.button>
                       ))}
                    </div>

                    <button 
                      onClick={() => setAuthState('email')}
                      className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-primary/40 hover:text-primary transition-colors"
                    >
                      Change Identified Node
                    </button>
                  </div>
                )}


               <button 
                 onClick={() => setShowPasscode(false)}
                 className="w-full text-[10px] font-black uppercase tracking-[0.3em] text-white/20 hover:text-white/40 transition-colors"
               >
                 Abort Authorization
               </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cinematic Transition Overlay */}
      <AnimatePresence>
        {entering && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[101] bg-black flex flex-col items-center justify-center p-10 cursor-none"
          >
            {/* Background Light Beam */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(var(--primary),0.1)_0%,transparent_70%)]"
            />
            
            <motion.div 
              animate={{ 
                scale: [1, 1.15, 1],
                opacity: [0.6, 1, 0.6]
              }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
              className="h-28 w-28 rounded-3xl border-2 border-primary relative flex items-center justify-center mb-16 shadow-[0_0_40px_rgba(var(--primary),0.5)] bg-primary/5"
            >
               <Brain className="h-12 w-12 text-primary drop-shadow-[0_0_10px_rgba(var(--primary),1)]" />
               <div className="absolute -inset-2 rounded-3xl border border-primary animate-ping" />
            </motion.div>

            <div className="w-full max-w-sm space-y-8 relative">
              <div className="flex justify-between items-end text-[10px] font-black text-primary uppercase tracking-[0.4em] mb-2">
                <span className="flex items-center gap-2"><Cpu className="h-3 w-3" /> Neutral Syncing...</span>
                <span className="text-white">{((loadingStep + 1) / steps.length * 100).toFixed(0)}%</span>
              </div>
              
              <div className="h-[2px] w-full bg-white/5 relative overflow-hidden">
                <motion.div 
                   initial={{ width: 0 }}
                   animate={{ width: `${((loadingStep + 1) / steps.length * 100)}%` }}
                   className="h-full bg-primary shadow-[0_0_10px_rgba(var(--primary),1)]"
                />
              </div>
              
              <div className="h-8 overflow-hidden relative">
                <AnimatePresence mode="wait">
                  <motion.p 
                    key={loadingStep}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -15 }}
                    className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-white/60"
                  >
                    {steps[loadingStep]}
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>
            
            <div className="fixed bottom-12 left-1/2 -translate-x-1/2 flex items-center gap-4 text-[8px] font-black uppercase tracking-[0.5em] text-white/10">
               <div className="h-[1px] w-12 bg-white/5" />
               ENCRYPTED TERMINAL LINK ACTIVE
               <div className="h-[1px] w-12 bg-white/5" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
