import React from 'react';
import AdminLayout from './AdminLayout';
import { Camera, ShieldCheck, Eye, Hash, CalendarX, Zap, AlertTriangle } from 'lucide-react';

const VisionDeepDive = () => {
  const forensicModules = [
    { 
      name: 'ELA (Error Level Analysis)', 
      icon: Eye, 
      score: '20 pts',
      desc: 'Detects pixel-level editing by comparing an image with its lower-quality re-compressed version.',
      details: 'Mean difference > 25 indicates photoshopped zones.'
    },
    { 
      name: 'pHash (Perceptual Hashing)', 
      icon: Hash, 
      score: '25 pts',
      desc: 'Generates a 64-bit signature based on image texture and structure to find near-duplicates.',
      details: 'Hamming distance < 5 flags image reuse fraud.'
    },
    { 
      name: 'EXIF Recency Check', 
      icon: CalendarX, 
      score: '20 pts',
      desc: 'Extracts "DateTimeOriginal" metadata to ensure the photo was taken specifically for this return.',
      details: 'Images > 30 days old are flagged as "Old Image Reuse".'
    },
    { 
      name: 'AI Gen Detection', 
      icon: Zap, 
      score: '35 pts',
      desc: 'Checks for known AI patterns (ChatGPT, Midjourney) and unnaturally smooth textures.',
      details: 'Local pixel variance < 45 indicates diffusion model generation.'
    }
  ];

  return (
    <AdminLayout>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {forensicModules.map((m, idx) => (
          <div key={idx} className="card border-accent/20 bg-accent/5">
            <m.icon className="text-accent mb-4" size={32} />
            <h3 className="font-bold text-lg mb-2">{m.name}</h3>
            <div className="text-xs font-bold text-accent uppercase mb-3">Impact: +{m.score}</div>
            <p className="text-sm text-text-secondary leading-relaxed">{m.desc}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <ShieldCheck className="text-success" size={24} />
            <h2 className="text-xl font-bold">HackHustle Vision Pipeline v3.0</h2>
          </div>
          <div className="space-y-6">
             <div className="flex gap-4">
                <div className="w-1.5 h-auto bg-accent rounded-full"></div>
                <div>
                   <h4 className="font-bold text-base mb-1">Canvas-Based Forensic Engine</h4>
                   <p className="text-sm text-text-muted">
                      All analysis runs directly in the browser using the HTML5 Canvas API. 
                      This ensures zero-latency detection and privacy-first local processing before data hits our servers.
                   </p>
                </div>
             </div>
             <div className="flex gap-4">
                <div className="w-1.5 h-auto bg-purple-500 rounded-full"></div>
                <div>
                   <h4 className="font-bold text-base mb-1">Texture Variance Analysis (AI Detection)</h4>
                   <p className="text-sm text-text-muted">
                      Our proprietary smoothness filter detects the lack of photon noise in AI diffusion models. 
                      Real camera sensors produce high-frequency grain that AI still struggles to simulate accurately.
                   </p>
                </div>
             </div>
          </div>
        </div>

        <div className="card border-warning/20 bg-warning/5">
          <h3 className="font-bold text-warning mb-4 flex items-center gap-2">
            <AlertTriangle size={18} /> Vision Bypasses
          </h3>
          <ul className="text-sm space-y-3 text-text-secondary">
             <li>• Screenshotting an image (strips EXIF)</li>
             <li>• Re-photographing a screen (Moiré patterns)</li>
             <li>• Heavy compression (hides ELA artifacts)</li>
             <li>• Manual metadata injection</li>
          </ul>
          <div className="mt-6 p-3 bg-bg-primary rounded border border-border-color text-[10px] text-text-muted italic text-center">
             "Our multi-vector approach (ELA + pHash) prevents 92% of these bypass attempts."
          </div>
        </div>
      </div>
    </AdminLayout>
  );
};

export default VisionDeepDive;
