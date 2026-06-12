import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Truck,
  Wrench,
  Send,
  Users,
  AlertOctagon,
  ZapOff,
  Hammer,
  Layers,
  Flame,
  ArrowRight,
} from 'lucide-react';
import type { UserProfile } from '../types/ptw';

interface EmployeeHomeProps {
  currentUser: UserProfile;
}

export const EmployeeHome: React.FC<EmployeeHomeProps> = ({ currentUser }) => {
  const navigate = useNavigate();

  const ptwForms = [
    {
      name: 'Vehicle Inspection Checklist',
      path: '/vehicle-inspection',
      code: 'KE-PTW-VI-01',
      desc: 'Mandatory safety checklist for all utility trucks and inspection vans before departure.',
      icon: Truck,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      name: 'Tools & PPE Checklist',
      path: '/tools-ppe',
      code: 'KE-PTW-TP-02',
      desc: 'Verify insulated tools rating and team PPE (boots, gloves, harnesses) integrity.',
      icon: Wrench,
      color: 'from-amber-500 to-orange-600',
    },
    {
      name: 'Shift Dispatching Checklist',
      path: '/shift-dispatch',
      code: 'KE-PTW-SD-03',
      desc: 'Control log for shift rotation, grid station targets, and radio signal verifications.',
      icon: Send,
      color: 'from-emerald-500 to-teal-600',
    },
    {
      name: 'Site TBT (Toolbox Talk) Form',
      path: '/toolbox-talk',
      code: 'KE-PTW-TBT-04',
      desc: 'Pre-work safety briefing log to document site hazards and crew signatures.',
      icon: Users,
      color: 'from-purple-500 to-violet-600',
    },
    {
      name: 'Receiving Fault & Excavation Request',
      path: '/fault-excavation',
      code: 'KE-PTW-FE-05',
      desc: 'Log electrical faults, cable faults, and authorize excavation requests.',
      icon: AlertOctagon,
      color: 'from-red-500 to-rose-600',
    },
    {
      name: 'Line Isolation PTW',
      path: '/line-isolation',
      code: 'KE-PTW-LI-06',
      desc: 'Feeder breaker racking, line de-energization, grounding and red tagging checks.',
      icon: ZapOff,
      color: 'from-yellow-500 to-amber-600',
    },
    {
      name: 'Excavation PTW',
      path: '/excavation',
      code: 'KE-PTW-EX-07',
      desc: 'Authorization and safety checklist for deep cable trenches and mechanical digging.',
      icon: Hammer,
      color: 'from-lime-500 to-green-600',
    },
    {
      name: 'Confined Space PTW',
      path: '/confined-space',
      code: 'KE-PTW-CS-08',
      desc: 'Atmospheric gas testing logs, blower setup, standby watchman placement for manholes.',
      icon: Layers,
      color: 'from-cyan-500 to-blue-600',
    },
    {
      name: 'Heat Shrink PTW',
      path: '/heat-shrink',
      code: 'KE-PTW-HS-09',
      desc: 'Hot work authorization for cable jointing using gas torches and open flames.',
      icon: Flame,
      color: 'from-pink-500 to-rose-600',
    },
  ];

  return (
    <div className="space-y-4 max-w-6xl mx-auto">
      {/* Compact Welcome Banner */}
      <div className="relative overflow-hidden bg-brand-primary rounded-xl px-4 py-3 text-white shadow-md border border-gray-800 flex items-center justify-between gap-4">
        <div className="absolute top-0 right-0 w-64 h-full bg-brand-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex items-center gap-3.5">
          <span className="bg-brand-accent/20 border border-brand-accent/30 text-brand-accent text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider shrink-0">
            Field Ops
          </span>
          <div>
            <h1 className="text-sm font-bold font-display tracking-tight leading-tight">
              Welcome back, {currentUser.name || 'Technician'}
            </h1>
            <p className="text-gray-300 text-[10px] mt-0.5">
              Complete and submit the operational checklists below to authorize utility tasks.
            </p>
          </div>
        </div>
      </div>

      {/* Forms Grid section */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <div>
            <h2 className="text-xs font-bold text-brand-navy tracking-wide">
              Active Permit-to-Work Forms
            </h2>
            <p className="text-[11px] text-gray-600 mt-0.5">Select a safety category to open a blank sheet.</p>
          </div>
          <span className="bg-gray-150 text-gray-700 font-mono text-[9px] font-bold px-2 py-0.5 rounded-full border border-gray-250">
            9 Forms
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {ptwForms.map((form, idx) => {
            const Icon = form.icon;
            return (
              <div
                key={idx}
                className="group bg-white border border-gray-255 hover:border-gray-350 rounded-xl p-3 shadow-xs hover:shadow-md transition-all duration-200 flex flex-col justify-between"
              >
                <div className="flex items-start gap-2.5">
                  <div className={`h-8.5 w-8.5 shrink-0 rounded-lg bg-linear-to-br ${form.color} text-white flex items-center justify-center shadow-xs group-hover:scale-105 transition-transform`}>
                    <Icon className="h-4.5 w-4.5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-[9px] font-mono text-gray-500 font-bold uppercase tracking-wider">{form.code}</div>
                    <h3 className="text-xs font-bold text-brand-navy mt-0.5 group-hover:text-brand-orange transition-colors leading-snug">
                      {form.name}
                    </h3>
                    <p className="text-[10px] text-gray-600 mt-1 leading-relaxed">
                      {form.desc}
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => navigate(form.path)}
                  className="mt-3 w-full flex items-center justify-center gap-1 bg-gray-50 hover:bg-brand-navy text-gray-700 hover:text-brand-accent border border-gray-200 hover:border-brand-navy px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer"
                >
                  Start New Entry <ArrowRight className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
