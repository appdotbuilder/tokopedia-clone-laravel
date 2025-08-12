import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { trpc } from '@/utils/trpc';
import type { User, UpdateUserInput } from '../../../../server/src/schema';

interface CustomerProfileProps {
  user: User;
}

export default function CustomerProfile({ user }: CustomerProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [profileForm, setProfileForm] = useState<Partial<UpdateUserInput>>({
    id: user.id,
    name: user.name,
    email: user.email,
    address: user.address,
    phone: user.phone
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // STUB: Using mock update since server handlers are placeholders
      // In real implementation, this would call trpc.updateUser.mutate(profileForm)
      console.log('Updating profile:', profileForm);
      
      // Mock successful update
      setTimeout(() => {
        setSuccessMessage('Profile updated successfully!');
        setIsEditing(false);
        setIsSubmitting(false);
        
        // Update localStorage if this is the current user
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
          const updatedUser = { ...JSON.parse(storedUser), ...profileForm };
          localStorage.setItem('currentUser', JSON.stringify(updatedUser));
        }
      }, 1000);
    } catch (error) {
      console.error('Failed to update profile:', error);
      setError('Failed to update profile. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match.');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setError('New password must be at least 6 characters long.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // STUB: Using mock password change since server handlers are placeholders
      console.log('Changing password for user:', user.id);
      
      // Mock successful password change
      setTimeout(() => {
        setSuccessMessage('Password changed successfully!');
        setPasswordForm({
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
        setIsSubmitting(false);
      }, 1000);
    } catch (error) {
      console.error('Failed to change password:', error);
      setError('Failed to change password. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setProfileForm({
      id: user.id,
      name: user.name,
      email: user.email,
      address: user.address,
      phone: user.phone
    });
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {successMessage && (
        <Alert className="border-green-200 bg-green-50">
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {/* Profile Information */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>👤 Profile Information</CardTitle>
              <p className="text-sm text-muted-foreground">
                Manage your personal information and account details
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              {user.role}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleProfileUpdate} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={profileForm.name || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProfileForm((prev: Partial<UpdateUserInput>) => ({ ...prev, name: e.target.value }))
                  }
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileForm.email || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setProfileForm((prev: Partial<UpdateUserInput>) => ({ ...prev, email: e.target.value }))
                  }
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              <Textarea
                id="address"
                value={profileForm.address || ''}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                  setProfileForm((prev: Partial<UpdateUserInput>) => ({ ...prev, address: e.target.value || null }))
                }
                disabled={!isEditing}
                placeholder="Enter your complete address"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={profileForm.phone || ''}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setProfileForm((prev: Partial<UpdateUserInput>) => ({ ...prev, phone: e.target.value || null }))
                }
                disabled={!isEditing}
                placeholder="Enter your phone number"
              />
            </div>

            <div className="flex gap-2 pt-4">
              {!isEditing ? (
                <Button type="button" onClick={() => setIsEditing(true)}>
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </Button>
                  <Button type="button" variant="outline" onClick={handleCancelEdit} disabled={isSubmitting}>
                    Cancel
                  </Button>
                </>
              )}
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Account Information */}
      <Card>
        <CardHeader>
          <CardTitle>📊 Account Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account Type</Label>
                <div className="flex items-center gap-2">
                  <Badge variant={user.role === 'Admin' ? 'destructive' : 'secondary'}>
                    {user.role}
                  </Badge>
                </div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Member Since</Label>
                <div>{user.created_at.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Last Updated</Label>
                <div>{user.updated_at.toLocaleDateString('en-US', { 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}</div>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Account ID</Label>
                <div className="font-mono text-sm">#{user.id.toString().padStart(6, '0')}</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle>🔒 Change Password</CardTitle>
          <p className="text-sm text-muted-foreground">
            Update your password to keep your account secure
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Current Password</Label>
              <Input
                id="currentPassword"
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))
                }
                placeholder="Enter your current password"
                required
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordForm.newPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))
                  }
                  placeholder="Enter new password"
                  minLength={6}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordForm.confirmPassword}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                    setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))
                  }
                  placeholder="Confirm new password"
                  minLength={6}
                  required
                />
              </div>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="text-sm font-medium text-blue-900 mb-2">Password Requirements</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• At least 6 characters long</li>
                <li>• Should contain a mix of letters and numbers</li>
                <li>• Avoid using personal information</li>
              </ul>
            </div>

            <Button 
              type="submit" 
              disabled={isSubmitting || !passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword}
            >
              {isSubmitting ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Privacy & Security */}
      <Card>
        <CardHeader>
          <CardTitle>🛡️ Privacy & Security</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Two-Factor Authentication</h4>
                <p className="text-sm text-muted-foreground">Add an extra layer of security to your account</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Enable 2FA
              </Button>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Login Sessions</h4>
                <p className="text-sm text-muted-foreground">Manage active sessions and devices</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                View Sessions
              </Button>
            </div>

            <div className="flex justify-between items-center p-4 border rounded-lg">
              <div>
                <h4 className="font-medium">Data Export</h4>
                <p className="text-sm text-muted-foreground">Download your account data</p>
              </div>
              <Button variant="outline" size="sm" disabled>
                Export Data
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}