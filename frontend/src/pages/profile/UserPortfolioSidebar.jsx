import React from 'react';
import { Lock } from 'lucide-react';
import './UserPortfolioSidebar.css';

const UserPortfolioSidebar = ({ isPrivate, onTogglePrivacy }) => {
  return (
    <section className='user-portfolio-privacy'>
      <div className='user-portfolio-privacy__card'>
        <div className='user-portfolio-privacy__content'>
          <div className='user-portfolio-privacy__icon'>
            <Lock size={20} />
          </div>
          <div className='user-portfolio-privacy__text'>
            <p className='user-portfolio-privacy__title'>
              Khóa Portfolio (Privacy Mode)
            </p>
            <p className='user-portfolio-privacy__description'>
              Toggle to lock or unlock your public portfolio visibility.
            </p>
          </div>
        </div>

        <label className='user-portfolio-privacy__switch' aria-label='Toggle portfolio privacy'>
          <input checked={isPrivate} onChange={onTogglePrivacy} type='checkbox' />
          <span className='user-portfolio-privacy__track' aria-hidden='true'>
            <span className='user-portfolio-privacy__thumb' />
          </span>
        </label>
      </div>
    </section>
  );
};

export default UserPortfolioSidebar;
