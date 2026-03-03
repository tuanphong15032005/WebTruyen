import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import useNotify from '../../hooks/useNotify';
import storyService from '../../services/storyService';

const Report = () => {
  const { storyId } = useParams();
  return <div>Đây là trang Report</div>;
};

export default Report;

/* 
          <button onClick={() => navigate('/test')}>
              Chuyển trang mới savep
            </button>

            */
