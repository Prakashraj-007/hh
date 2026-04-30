import React, { useState, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ShieldCheck, UploadCloud, CheckCircle, Clock, MessageSquare, AlertCircle } from 'lucide-react';
import { calculateRiskScore } from '../../utils/riskEngine';
import { analyzeSearchIntent, markSessionAsReturned } from '../../utils/searchIntentEngine';
import { analyzeImage } from '../../utils/imageForensics';
import FraudChatbot from '../../components/FraudChatbot';

const ReturnForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const orderId = searchParams.get('orderId');
  
  const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser') || '{}');
  const order = loggedInUser.orders?.find(o => o.id === orderId) || { product: 'Unknown', category: 'Fashion', policyDays: 14, amount: '₹0' };

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    reason: '',
    description: '',
    requestedOnDay: 1, // Defaulting to day 1
  });

  const [analysisState, setAnalysisState] = useState({
    stage: 0,
    result: null
  });
  const [hasImage, setHasImage] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // customer-visible photo preview
  const [imageAnalysis, setImageAnalysis] = useState(null); // forensics result (admin only)
  const [imageAnalyzing, setImageAnalyzing] = useState(false);
  const fileInputRef = useRef(null);
  const [showChatbot, setShowChatbot] = useState(false);
  const [savedClaim, setSavedClaim] = useState(null);
  const [chatCompleted, setChatCompleted] = useState(false);

  // Handle real image upload + forensic analysis
  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous preview URL to free memory
    if (imagePreviewUrl) URL.revokeObjectURL(imagePreviewUrl);

    // Create a local object URL for the customer photo preview
    const previewUrl = URL.createObjectURL(file);
    setImagePreviewUrl(previewUrl);
    setImageFile(file);
    setHasImage(true);
    setImageAnalysis(null);
    setImageAnalyzing(true);
    try {
      const result = await analyzeImage(file);
      setImageAnalysis(result);
    } catch (err) {
      console.error('Image forensics failed:', err);
      setImageAnalysis({ imageScore: 0, flags: ['ANALYSIS_FAILED'], elaFlag: false, hashFlag: false, exifStatus: 'ERROR', elaMean: 0, hashDistance: 64, dateTaken: null, elaImageDataUrl: null });
    } finally {
      setImageAnalyzing(false);
    }
  };

  // Dynamic window calculation
  const daysUsed = parseInt(formData.requestedOnDay);
  const daysRemaining = order.policyDays - daysUsed;
  const isFinalTwoDays = daysRemaining <= 1;

  const handleSimulateSubmit = () => {
    setStep(2); // Move to Analysis Step
    
    // Simulate AI Process
    const stages = [
      "Fetching Order Policy...",
      "Checking Return Window...",
      "Running Behavioral Analysis...",
      "Running Image Verification...",
      "Checking Network Risk...",
      "Calculating Final Score..."
    ];

    let currentStage = 0;
    const interval = setInterval(() => {
      currentStage++;
      if (currentStage < stages.length) {
        setAnalysisState(prev => ({ ...prev, stage: currentStage }));
      } else {
        clearInterval(interval);
        
        // Calculate result using engine
        const claimData = {
          requestedOnDay: parseInt(formData.requestedOnDay),
          policyDays: order.policyDays,
          category: order.category,
          amount: order.amount,
          hasImage: hasImage,
          imageForensics: imageAnalysis  // real forensics result
        };
        const existingClaims = JSON.parse(localStorage.getItem('claims') || '[]');

        // Run Search Intent Engine (Wardrobing Detection)
        const wardrobingIntent = analyzeSearchIntent(
          loggedInUser.id,
          order.category,
          parseInt(formData.requestedOnDay),
          order.policyDays
        );
        
        const result = calculateRiskScore(claimData, loggedInUser, existingClaims, wardrobingIntent);
        
        // Mark the session as returned for future historical correlation
        markSessionAsReturned(loggedInUser.id);
        
        setTimeout(() => {
          setAnalysisState({ stage: stages.length, result });
          setStep(3); // Move to Result Step
          
          // Generate a random IP for this session's networking forensic context
          const randomIP = `192.168.${Math.floor(Math.random()*255)}.${Math.floor(Math.random()*255)}`;
          const locationData = ['Mumbai, India', 'Bangalore, India', 'Delhi, India', 'Hyderabad, India', 'Chennai, India'][Math.floor(Math.random()*5)];
          
          // Format Account Age nicely
          const totalMonths = Math.floor(loggedInUser.accountAgeDays / 30);
          const years = Math.floor(totalMonths / 12);
          const months = totalMonths % 12;
          const formattedAge = years > 0 ? `${years}Y ${months}M` : `${months} Months`;

          // Save result to local storage for Admin Portal to see
          const newClaim = {
            id: `CLM-${Math.floor(Math.random()*10000)}`,
            orderId: orderId,
            customer: loggedInUser.name,
            product: order.product,
            category: order.category,
            reason: formData.reason,
            description: formData.description,
            amount: order.amount,
            policyDays: order.policyDays,
            requestedOnDay: claimData.requestedOnDay,
            ipAddress: randomIP,
            location: locationData,
            // Risk engine scores
            score: result.score,
            behaviorScore: result.behaviorScore,
            behaviorBreakdown: result.behaviorBreakdown,
            imageScore: result.imageScore,
            imageForensics: imageAnalysis,
            networkScore: result.networkScore,
            networkBreakdown: result.networkBreakdown,
            wardrobingScore: result.wardrobingScore,
            wardrobingBreakdown: result.wardrobingBreakdown,
            // Customer intelligence fields
            trustScore: result.trustScore,
            accountAgeDays: loggedInUser.accountAgeDays,
            formattedAccountAge: formattedAge,
            totalSpend: loggedInUser.totalSpend,
            returnRatio: ((loggedInUser.totalReturns || 0) / Math.max(1, loggedInUser.totalOrders || 1)),
            status: result.status,
            riskLevel: result.riskLevel,
            logs: result.logs
          };

          const existing = JSON.parse(localStorage.getItem('claims') || '[]');
          localStorage.setItem('claims', JSON.stringify([newClaim, ...existing]));
          setSavedClaim(newClaim);

        }, 1000);
      }
    }, 800);
  };

  const AnalysisStages = [
    "Fetching Order Policy...",
    "Checking Return Window...",
    "Running Behavioral Analysis...",
    "Running Image Verification...",
    "Checking Network Risk...",
    "Calculating Final Score..."
  ];

  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center py-12 px-4">
      <div className="w-full max-w-2xl">
        <div className="flex items-center gap-2 mb-8 justify-center">
          <ShieldCheck className="text-accent" size={32} />
          <span className="text-2xl font-bold">Return Request</span>
        </div>

        {step === 1 && (
          <div className="card animate-fade-in">
            <div className="mb-6 pb-6 border-b border-border-color">
              <h2 className="text-xl font-semibold mb-2">Item Details</h2>
              <div className="flex justify-between text-text-secondary">
                <span>{order.product} ({order.category})</span>
                <span>{order.amount}</span>
              </div>
            </div>

            {/* Return Day Risk Zone Indicator */}
            <div className="mb-6 p-4 bg-bg-secondary rounded-lg border border-border-color">
              <div className="flex justify-between items-center mb-3">
                <div>
                  <div className="text-sm text-text-secondary">Return Policy Window</div>
                  <div className="font-semibold">{order.policyDays} Days Total</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-text-secondary">You are returning on</div>
                  <div className={`font-bold text-lg ${
                    daysUsed <= Math.floor(order.policyDays * 0.5) ? 'text-warning' :
                    daysUsed >= order.policyDays - 1 ? 'text-danger' : 'text-success'
                  }`}>Day {daysUsed}</div>
                </div>
              </div>

              {/* Visual progress bar with zones */}
              <div className="relative h-6 rounded-full overflow-hidden flex text-[10px] font-bold">
                <div className="flex-1 bg-[rgba(234,179,8,0.3)] flex items-center justify-center text-warning">
                  🛍️ Wardrobing Zone
                </div>
                <div style={{flex: 0.4}} className="bg-[rgba(34,197,94,0.3)] flex items-center justify-center text-success">
                  ✓ Safe
                </div>
                <div className="flex-1 bg-[rgba(239,68,68,0.3)] flex items-center justify-center text-danger">
                  ⚠ Deadline Abuse
                </div>
              </div>

              {/* Pointer arrow showing which zone the selected day falls in */}
              <div className="relative h-4 mt-1">
                <div
                  className="absolute -translate-x-1/2 text-white text-xs font-bold"
                  style={{ left: `${Math.min(98, Math.max(2, (daysUsed / order.policyDays) * 100))}%` }}
                >▲</div>
              </div>

              <div className="mt-2 text-xs text-center font-medium">
                {daysUsed <= Math.floor(order.policyDays * 0.5) ? (
                  <span className="text-warning">⚠ Early return after delivery may indicate post-event wardrobing</span>
                ) : daysUsed >= order.policyDays - 1 ? (
                  <span className="text-danger">⚠ Last-moment return may indicate policy deadline abuse</span>
                ) : (
                  <span className="text-success">✓ Normal return window — no pattern detected</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 mb-4">
              <div className="input-group">
                <label className="input-label">Which day are you returning? (Day 1 = just after delivery)</label>
                <input 
                  type="number" 
                  className="input-field"
                  min="1" max={order.policyDays}
                  value={formData.requestedOnDay}
                  onChange={(e) => setFormData({...formData, requestedOnDay: e.target.value})}
                />
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Return Reason</label>
              <select className="input-field" value={formData.reason} onChange={e => setFormData({...formData, reason: e.target.value})}>
                <option value="">Select a reason</option>
                <option value="defective">Defective / Does not work</option>
                <option value="wrong_item">Wrong item sent</option>
                <option value="changed_mind">Changed my mind</option>
              </select>
            </div>

            <div className="input-group">
              <label className="input-label">Description</label>
              <textarea 
                className="input-field" 
                rows="3"
                value={formData.description}
                onChange={e => setFormData({...formData, description: e.target.value})}
                placeholder="Please describe the issue..."
              ></textarea>
            </div>

            <div className="input-group mb-8">
              <label className="input-label">Upload Proof Image</label>

              {/* Hidden real file input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                className="hidden"
                onChange={handleImageUpload}
                id="proof-image-input"
              />

              {/* Upload zone — clean customer view, NO forensics details shown */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition ${
                  hasImage
                    ? imageAnalyzing
                      ? 'border-accent/50'
                      : 'border-success'
                    : 'border-border-color hover:border-accent/50'
                }`}
                style={{ minHeight: '180px' }}
              >
                {/* Empty state */}
                {!hasImage && (
                  <div className="flex flex-col items-center justify-center p-10 text-text-secondary">
                    <UploadCloud size={36} className="mb-3 opacity-60" />
                    <p className="font-semibold text-base">Click to upload proof image</p>
                    <p className="text-xs opacity-50 mt-1.5">JPG, PNG or WebP · Max 10 MB</p>
                  </div>
                )}

                {/* Verifying spinner — shown over the preview thumbnail while forensics run */}
                {hasImage && imageAnalyzing && (
                  <div className="flex flex-col items-center justify-center p-10 text-accent">
                    <div className="w-10 h-10 rounded-full border-2 border-accent border-t-transparent animate-spin mb-3" />
                    <p className="font-semibold text-base">Verifying image…</p>
                    <p className="text-xs opacity-50 mt-1">Please wait</p>
                  </div>
                )}

                {/* Photo preview — actual customer image shown as a thumbnail */}
                {hasImage && !imageAnalyzing && imagePreviewUrl && (
                  <div className="relative">
                    {/* The actual uploaded photo */}
                    <img
                      src={imagePreviewUrl}
                      alt="Proof image"
                      className="w-full object-cover rounded-lg"
                      style={{ maxHeight: '260px', objectFit: 'cover' }}
                    />
                    {/* Success overlay bar at the bottom */}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 backdrop-blur-sm px-4 py-2.5 flex items-center justify-between">
                      <div className="flex items-center gap-2 text-success">
                        <CheckCircle size={16} />
                        <span className="text-sm font-semibold">Image Received</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white text-xs opacity-80 max-w-[160px] truncate">{imageFile?.name}</p>
                        <p className="text-white text-[10px] opacity-50">{imageFile ? (imageFile.size / 1024).toFixed(0) + ' KB' : ''} · Click to replace</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <button className="btn btn-primary w-full py-3 text-lg" onClick={handleSimulateSubmit}>
              Submit Return Request
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="card text-center py-12 animate-fade-in">
            <div className="w-16 h-16 border-4 border-bg-secondary border-t-accent rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-2xl font-bold mb-8">AI Analysis in Progress</h2>
            
            <div className="max-w-md mx-auto text-left space-y-4">
              {AnalysisStages.map((stage, idx) => (
                <div key={idx} className={`flex items-center gap-3 ${idx > analysisState.stage ? 'opacity-30' : 'opacity-100'}`}>
                  {idx < analysisState.stage ? (
                    <CheckCircle className="text-success" size={20} />
                  ) : idx === analysisState.stage ? (
                    <div className="w-5 h-5 rounded-full border-2 border-accent border-t-transparent animate-spin"></div>
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-border-color"></div>
                  )}
                  <span className={idx === analysisState.stage ? 'font-medium text-accent' : ''}>{stage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {step === 3 && analysisState.result && (
          <div className="card text-center py-10 animate-fade-in">
            {analysisState.result.status === 'Approved' && (
              <div className="text-success mb-4 flex justify-center"><CheckCircle size={64} /></div>
            )}
            {analysisState.result.status === 'Soft Verification' && (
              <div className="text-warning mb-4 flex justify-center"><Clock size={64} /></div>
            )}
            {analysisState.result.status === 'Manual Review' && (
              <div className="text-danger mb-4 flex justify-center"><AlertCircle size={64} /></div>
            )}

            <h2 className="text-3xl font-bold mb-2">
              {analysisState.result.status === 'Approved' ? 'Return Approved!' :
               analysisState.result.status === 'Soft Verification' ? 'Identity Verification Needed' : 'Request Under Review'}
            </h2>

            <p className="text-text-secondary mb-6">
              {analysisState.result.status === 'Approved'
                ? 'Your return has been automatically approved. Instructions have been sent to your email.'
                : analysisState.result.status === 'Soft Verification'
                ? 'For security, please verify your account via OTP to proceed with the refund.'
                : 'Our security system has flagged this request for manual verification. A specialist will review it within 24 hours.'}
            </p>

            {/* Chatbot Trigger — activates when score > 20 */}
            {analysisState.result.score > 20 && !chatCompleted && (
              <div className="mb-6 p-4 bg-[rgba(139,92,246,0.08)] border border-accent/30 rounded-xl">
                <div className="flex items-center gap-2 justify-center mb-2">
                  <MessageSquare size={20} className="text-accent" />
                  <span className="font-semibold text-accent">Additional Verification Required</span>
                </div>
                <p className="text-sm text-text-secondary mb-4">
                  Our AI detected risk signals in your return. A quick 5-question chat with our SecureVerify AI can help speed up processing.
                </p>
                <button
                  onClick={() => setShowChatbot(true)}
                  className="btn btn-primary flex items-center gap-2 mx-auto"
                >
                  <MessageSquare size={16} /> Start Secure Verification Chat
                </button>
              </div>
            )}

            {chatCompleted && (
              <div className="mb-6 p-4 bg-success/10 border border-success/30 rounded-xl flex items-center gap-2 justify-center text-success">
                <CheckCircle size={18} /> Chat verification complete — Admin notified
              </div>
            )}

            <button className="btn btn-outline" onClick={() => navigate('/customer')}>
              Back to Dashboard
            </button>
          </div>
        )}

        {/* Fraud Chatbot Modal */}
        {showChatbot && savedClaim && (
          <FraudChatbot
            claim={savedClaim}
            userProfile={loggedInUser}
            onClose={() => setShowChatbot(false)}
            onComplete={(summary) => {
              setShowChatbot(false);
              setChatCompleted(true);
            }}
          />
        )}

      </div>
    </div>
  );
};

export default ReturnForm;
