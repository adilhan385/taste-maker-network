import { useState } from 'react';
import { CreditCard, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { t, Language } from '@/lib/i18n';

interface CardPaymentFormProps {
  language: Language;
  showAddress: boolean;
  onFormChange: (data: CardPaymentData) => void;
  formData: CardPaymentData;
}

export interface CardPaymentData {
  // Address fields
  street: string;
  city: string;
  notes: string;
  // Card fields
  cardNumber: string;
  expiryDate: string;
  cvv: string;
  cardholderName: string;
}

export const initialCardPaymentData: CardPaymentData = {
  street: '',
  city: '',
  notes: '',
  cardNumber: '',
  expiryDate: '',
  cvv: '',
  cardholderName: '',
};

export function validateCardPayment(data: CardPaymentData, showAddress: boolean): string | null {
  if (showAddress) {
    if (!data.street.trim()) return 'Street address is required';
    if (!data.city.trim()) return 'City is required';
  }
  if (!data.cardNumber.replace(/\s/g, '').match(/^\d{16}$/)) return 'Invalid card number';
  if (!data.expiryDate.match(/^\d{2}\/\d{2}$/)) return 'Invalid expiry date (MM/YY)';
  if (!data.cvv.match(/^\d{3,4}$/)) return 'Invalid CVV';
  if (!data.cardholderName.trim()) return 'Cardholder name is required';
  return null;
}

export default function CardPaymentForm({ language, showAddress, onFormChange, formData }: CardPaymentFormProps) {
  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    return parts.length ? parts.join(' ') : value;
  };

  const formatExpiry = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return v.substring(0, 2) + '/' + v.substring(2, 4);
    }
    return v;
  };

  const handleChange = (field: keyof CardPaymentData, value: string) => {
    let formattedValue = value;
    if (field === 'cardNumber') {
      formattedValue = formatCardNumber(value);
    } else if (field === 'expiryDate') {
      formattedValue = formatExpiry(value.replace('/', ''));
    } else if (field === 'cvv') {
      formattedValue = value.replace(/[^0-9]/g, '').substring(0, 4);
    }
    onFormChange({ ...formData, [field]: formattedValue });
  };

  return (
    <div className="space-y-6">
      {/* Delivery Address Section */}
      {showAddress && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-sm font-medium">
            <MapPin className="w-4 h-4 text-primary" />
            {t('payment.deliveryAddress', language)}
          </div>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="street">{t('payment.street', language)} *</Label>
              <Input
                id="street"
                value={formData.street}
                onChange={(e) => handleChange('street', e.target.value)}
                placeholder={t('payment.streetPlaceholder', language)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="city">{t('payment.city', language)} *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange('city', e.target.value)}
                placeholder={t('payment.cityPlaceholder', language)}
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="notes">{t('payment.notes', language)}</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleChange('notes', e.target.value)}
                placeholder={t('payment.notesPlaceholder', language)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
        </div>
      )}

      {/* Card Details Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 text-sm font-medium">
          <CreditCard className="w-4 h-4 text-primary" />
          {t('payment.cardDetails', language)}
        </div>
        
        <div className="space-y-3">
          <div>
            <Label htmlFor="cardNumber">{t('payment.cardNumber', language)} *</Label>
            <Input
              id="cardNumber"
              value={formData.cardNumber}
              onChange={(e) => handleChange('cardNumber', e.target.value)}
              placeholder="0000 0000 0000 0000"
              maxLength={19}
              className="mt-1 font-mono"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="expiryDate">{t('payment.expiryDate', language)} *</Label>
              <Input
                id="expiryDate"
                value={formData.expiryDate}
                onChange={(e) => handleChange('expiryDate', e.target.value)}
                placeholder="MM/YY"
                maxLength={5}
                className="mt-1 font-mono"
              />
            </div>
            
            <div>
              <Label htmlFor="cvv">{t('payment.cvv', language)} *</Label>
              <Input
                id="cvv"
                type="password"
                value={formData.cvv}
                onChange={(e) => handleChange('cvv', e.target.value)}
                placeholder="•••"
                maxLength={4}
                className="mt-1 font-mono"
              />
            </div>
          </div>
          
          <div>
            <Label htmlFor="cardholderName">{t('payment.cardholderName', language)} *</Label>
            <Input
              id="cardholderName"
              value={formData.cardholderName}
              onChange={(e) => handleChange('cardholderName', e.target.value.toUpperCase())}
              placeholder="JOHN DOE"
              className="mt-1 uppercase"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
