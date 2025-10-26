import React, { useState } from 'react';
import { Settings, Check, X } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { getContractAddress, setContractAddress, isValidContractAddress } from '../lib/config';

export const ContractAddressButton: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [address, setAddress] = useState(getContractAddress());
  const [isValid, setIsValid] = useState(true);

  const handleAddressChange = (value: string) => {
    setAddress(value);
    setIsValid(isValidContractAddress(value));
  };

  const handleSave = () => {
    if (isValid && address.trim()) {
      setContractAddress(address.trim());
      setIsOpen(false);
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('contractAddressChanged', { 
        detail: { address: address.trim() } 
      }));
    }
  };

  const handleCancel = () => {
    setAddress(getContractAddress());
    setIsValid(true);
    setIsOpen(false);
  };

  const truncateAddress = (addr: string) => {
    if (!addr) return 'Not Set';
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-6)}`;
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="flex items-center gap-2"
        >
          <Settings className="w-4 h-4" />
          <span className="hidden sm:inline">Contract</span>
          <span className="text-xs text-muted-foreground">
            {truncateAddress(getContractAddress())}
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Contract Address Configuration</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">
              Proctoring Contract Address
            </label>
            <Input
              value={address}
              onChange={(e) => handleAddressChange(e.target.value)}
              placeholder="Enter contract address (e.g., 1234)"
              className={!isValid ? 'border-red-500' : ''}
            />
            {!isValid && address && (
              <p className="text-sm text-red-500 mt-1">
                Please enter a valid contract address
              </p>
            )}
          </div>
          
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={handleCancel}
            >
              <X className="w-4 h-4 mr-2" />
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={!isValid || !address.trim()}
            >
              <Check className="w-4 h-4 mr-2" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
