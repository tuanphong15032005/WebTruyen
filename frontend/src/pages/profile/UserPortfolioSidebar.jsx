import React from 'react';
import { Lock } from 'lucide-react';

const UserPortfolioSidebar = ({ data, isPrivate, onTogglePrivacy }) => {
    return (
        <section className="mt-8">
            <div className="p-5 bg-white/70 backdrop-blur-md rounded-2xl flex items-center justify-between border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-500">
                        <Lock size={20} />
                    </div>
                    <div>
                        <p className="font-bold text-gray-900">Khóa Portfolio (Privacy Mode)</p>
                        <p className="text-sm text-gray-500">Toggle to lock or unlock your public portfolio visibility.</p>
                    </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                        checked={isPrivate} 
                        onChange={onTogglePrivacy}
                        className="sr-only peer" 
                        type="checkbox" 
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                </label>
            </div>
        </section>
    );
};

export default UserPortfolioSidebar;
