import { useState } from 'react';
import { useNavigate } from 'react-router';
import { Truck, Bike, Plane, ArrowRight } from 'lucide-react';
import { Assets } from '../shared/assets';

export const OnboardingPage = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  const steps = [
    {
      title: "트럭커의 세계에 오신 것을 환영합니다",
      description: "작은 자전거 배달부터 시작하여 거대한 항공 물류 제국을 건설하세요.",
      icon: <Bike className="h-12 w-12 text-primary-500" />,
      image: Assets.images.basicBicycle
    },
    {
      title: "실시간 운송 시뮬레이션",
      description: "실제 도로를 따라 이동하며 연료를 관리하고 단속을 피하세요.",
      icon: <Truck className="h-12 w-12 text-primary-500" />,
      image: Assets.images.characters.trucker
    },
    {
      title: "전 세계를 무대로",
      description: "평판을 쌓아 대륙간 항공 운송 라이선스를 획득하고 막대한 수익을 올리세요.",
      icon: <Plane className="h-12 w-12 text-primary-500" />,
      image: Assets.images.characters.pilot
    }
  ];

  const currentStep = steps[step - 1];

  const handleNext = () => {
    if (step < steps.length) {
      setStep(step + 1);
    } else {
      navigate('/login');
    }
  };

  return (
    <div className="h-[100dvh] bg-white flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center min-h-0">
        <div className="w-full max-w-sm space-y-8 flex flex-col items-center">
          <div className="relative w-48 h-48 rounded-full bg-surface-50 flex items-center justify-center overflow-hidden shadow-soft-xl shrink-0">
            <img 
              src={currentStep.image} 
              alt="Onboarding" 
              className="w-full h-full object-contain p-4 transform -scale-x-100"
            />
          </div>
          
          <div className="space-y-3 w-full">
            <div className="flex justify-center mb-1">{currentStep.icon}</div>
            <h1 className="text-2xl font-medium text-surface-900 leading-tight">
              {currentStep.title}
            </h1>
            <p className="text-sm text-surface-500 leading-relaxed px-4">
              {currentStep.description}
            </p>
          </div>

          <div className="flex gap-2 justify-center">
            {steps.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  step === i + 1 ? 'w-8 bg-primary-600' : 'w-2 bg-surface-200'
                }`} 
              />
            ))}
          </div>

          <div className="w-full pt-4">
            <button
              onClick={handleNext}
              className="w-full py-4 bg-primary-600 text-white rounded-2xl font-medium text-lg shadow-soft-lg flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              {step === steps.length ? "시작하기" : "다음으로"}
              <ArrowRight className="h-5 w-5" />
            </button>
            {step < steps.length && (
              <button 
                onClick={() => navigate('/login')}
                className="w-full mt-4 py-2 text-sm font-medium text-surface-400 hover:text-surface-600 transition-colors"
              >
                건너뛰기
              </button>
            )}
          </div>
        </div>
      </div>
      <div className="h-safe-bottom shrink-0" />
    </div>
  );
};
