import React from 'react';

interface JobRoleSelectorProps {
  jobRoles: string[];
  selectedRole: string | null;
  onSelectRole: (role: string) => void;
}

const JobRoleSelector: React.FC<JobRoleSelectorProps> = ({
  jobRoles,
  selectedRole,
  onSelectRole,
}) => {
  return (
    <div className="mb-8">
      <h2 className="text-xl font-semibold mb-4">Select a Job Role</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {jobRoles.map((role) => (
          <button
            key={role}
            className={`p-4 rounded-lg border transition-colors ${
              selectedRole === role
                ? 'bg-green-600 text-white'
                : 'bg-white hover:bg-gray-100'
            }`}
            onClick={() => onSelectRole(role)}
          >
            {role}
          </button>
        ))}
      </div>
    </div>
  );
};

export default JobRoleSelector; 