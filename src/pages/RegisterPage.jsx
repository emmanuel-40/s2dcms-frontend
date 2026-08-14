// Student Registration Page
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { departmentService } from '../services/departmentService';
import Alert from '../components/Alert';
import PasswordInput from '../components/PasswordInput';
import RateLimitWarning from '../components/RateLimitWarning';

const RegisterPage = () => {
  const [formData, setFormData] = useState({
    name: '',
    regNo: '',
    email: '',
    password: '',
    departmentId: '',
  });
  const [departments, setDepartments] = useState([]);
  const [filteredDepartments, setFilteredDepartments] = useState([]);
  const [loadingDepartments, setLoadingDepartments] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [attemptsWarning, setAttemptsWarning] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const { registerStudent } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const data = await departmentService.getAllDepartments();
        setDepartments(data);
        setFilteredDepartments(data);
      } catch (err) {
        console.error('Failed to fetch departments:', err);
      } finally {
        setLoadingDepartments(false);
      }
    };
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (deptSearch) {
      const filtered = departments.filter(dept =>
        dept.departmentName.toLowerCase().includes(deptSearch.toLowerCase())
      );
      setFilteredDepartments(filtered);
    } else {
      setFilteredDepartments(departments);
    }
  }, [deptSearch, departments]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setAttemptsWarning('');
    setLoading(true);

    try {
      const result = await registerStudent({
        ...formData,
        departmentId: parseInt(formData.departmentId),
      });
      setSuccess(result);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      if (err.message.includes('Too many attempts')) {
        setAttemptsWarning(err.message);
        setError('Rate limit exceeded. Please wait before trying again.');
      } else {
        setError(err.message || 'Registration failed');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-blue-800 p-4">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <Link to="/" className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1">
            ← Back to Home
          </Link>
        </div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Student Registration</h1>
        
        {error && <Alert>{error}</Alert>}

        <RateLimitWarning message={attemptsWarning} />

        {success && <Alert variant="success">{success}</Alert>}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="regNo" className="block text-sm font-medium text-gray-700 mb-2">Registration Number</label>
            <input
              type="text"
              id="regNo"
              name="regNo"
              value={formData.regNo}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
            />
          </div>
          
          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">Password (min 6 characters)</label>
            <PasswordInput value={formData.password} onChange={handleChange} minLength="6" />
          </div>
          
          <div className="mb-6">
            <label htmlFor="departmentId" className="block text-sm font-medium text-gray-700 mb-2">Department</label>
            {loadingDepartments ? (
              <div className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-500">
                Loading departments...
              </div>
            ) : (
              <>
                <input
                  type="text"
                  placeholder="Search department..."
                  value={deptSearch}
                  onChange={(e) => setDeptSearch(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none mb-2"
                />
                <div className="relative">
                  <div
                    onClick={() => setShowDropdown(!showDropdown)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-white cursor-pointer flex justify-between items-center"
                  >
                    <span>{formData.departmentId ? departments.find(d => d.id === parseInt(formData.departmentId))?.departmentName : 'Select a department'}</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                  {showDropdown && (
                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                      {filteredDepartments.length === 0 ? (
                        <div className="px-4 py-2 text-gray-500">No departments found</div>
                      ) : (
                        filteredDepartments.map((dept) => (
                          <div
                            key={dept.id}
                            onClick={() => {
                              setFormData({ ...formData, departmentId: dept.id.toString() });
                              setShowDropdown(false);
                              setDeptSearch('');
                            }}
                            className="px-4 py-2 hover:bg-blue-50 cursor-pointer truncate"
                            title={dept.departmentName}
                          >
                            {dept.departmentName}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
          
          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {loading ? 'Registering...' : 'Register'}
          </button>
        </form>
        
        <div className="mt-4 text-center text-sm">
          <Link to="/login" className="text-blue-600 hover:text-blue-800">Already have an account? Login</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
