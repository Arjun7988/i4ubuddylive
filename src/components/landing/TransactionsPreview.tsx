import { useNavigate } from 'react-router-dom';
import { Wallet, PieChart, TrendingUp, ArrowRight } from 'lucide-react';

const features = [
  {
    icon: Wallet,
    title: 'Split Your Bills Easily',
    description: 'Share expenses with friends and family',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: PieChart,
    title: 'Track Daily Expenses',
    description: 'Understand where your money goes',
    color: 'from-blue-500 to-indigo-500',
  },
  {
    icon: TrendingUp,
    title: 'Manage Group Payments',
    description: 'Settle up in one simple step',
    color: 'from-purple-500 to-violet-500',
  },
];

export function TransactionsPreview() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-heading font-bold text-white">Transactions & Budgets</h2>
        <button
          onClick={() => navigate('/transactions')}
          className="text-primary-400 hover:text-primary-300 text-sm font-medium flex items-center gap-1 group"
        >
          Get Started
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </button>
      </div>

      <div className="space-y-3">
        {features.map((feature, index) => (
          <div
            key={index}
            onClick={() => navigate('/transactions')}
            className="glass glass-border rounded-xl p-4 hover:shadow-glow transition-all duration-300 cursor-pointer group"
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 bg-gradient-to-br ${feature.color} rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>

              <div className="flex-1 min-w-0">
                <h3 className="text-white font-semibold mb-1">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>

              <ArrowRight className="w-5 h-5 text-gray-600 group-hover:text-primary-400 group-hover:translate-x-1 transition-all duration-300" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
