import { useNavigate } from 'react-router-dom';
import { FiCheckCircle, FiBarChart2, FiAlertCircle, FiFileText } from 'react-icons/fi';

export default function Footer() {
  const navigate = useNavigate();

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-secondary text-white">
      <div className="flex justify-around p-2">
        <button className="flex flex-col items-center" onClick={() => navigate('/allDelivery')}>
          <FiCheckCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Delivered</span>
        </button>
        <button className="flex flex-col items-center" onClick={() => navigate('/allTransaction')}>
          <FiBarChart2 className="h-6 w-6 mb-1" />
          <span className="text-xs">Report</span>
        </button>
        <button className="flex flex-col items-center" onClick={() => navigate('/allTransaction1')}>
          <FiAlertCircle className="h-6 w-6 mb-1" />
          <span className="text-xs">Outstanding</span>
        </button>
        <button className="flex flex-col items-center" onClick={() => navigate('/allBills')}>
          <FiFileText className="h-6 w-6 mb-1" />
          <span className="text-xs">Bills</span>
        </button>
      </div>
    </div>
  );
}

