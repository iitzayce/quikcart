'use client';

import { useState } from 'react';

export interface UserPreferences {
  shoppingStyle: 'lowest_price' | 'organic' | 'balanced' | 'favorite_brands' | '';
  brandPreference: 'store_brands' | 'national_brands' | 'no_preference' | '';
  mustHaveBrands?: string;
  dietaryFilters: string[];
  organicImportance: 'always' | 'sometimes' | 'doesnt_matter' | '';
  packSize: 'larger' | 'smaller' | 'doesnt_matter' | '';
  substitutions: 'auto' | 'suggest' | 'none' | '';
}

interface PreferencesSidebarProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
  isOpen: boolean;
  onClose: () => void;
}

export default function PreferencesSidebar({
  preferences,
  onPreferencesChange,
  isOpen,
  onClose,
}: PreferencesSidebarProps) {
  const updatePreference = <K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) => {
    onPreferencesChange({ ...preferences, [key]: value });
  };

  const toggleDietaryFilter = (filter: string) => {
    const newFilters = preferences.dietaryFilters.includes(filter)
      ? preferences.dietaryFilters.filter(f => f !== filter)
      : [...preferences.dietaryFilters, filter];
    updatePreference('dietaryFilters', newFilters);
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-2xl z-50 overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-[#00A862]">Preferences</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Section 1: Shopping Style */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Shopping Style</h3>
            <div className="space-y-2">
              {[
                { value: 'lowest_price', label: '🛒 Lowest overall price', icon: '🛒' },
                { value: 'organic', label: '🌱 Prefer organic whenever possible', icon: '🌱' },
                { value: 'balanced', label: '⭐ Balanced — mix of quality & price', icon: '⭐' },
                { value: 'favorite_brands', label: '🏷️ Favorite brands first', icon: '🏷️' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.shoppingStyle === option.value
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="shoppingStyle"
                    value={option.value}
                    checked={preferences.shoppingStyle === option.value}
                    onChange={(e) => updatePreference('shoppingStyle', e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 2: Brand Preferences */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Brand Preferences</h3>
            <div className="space-y-2">
              {[
                { value: 'store_brands', label: 'Always buy store brands (Instacart / Kirkland / Great Value / etc.)' },
                { value: 'national_brands', label: 'Prefer national brands (e.g., Chobani, Jif, Oatly)' },
                { value: 'no_preference', label: 'No strong preference' },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.brandPreference === option.value
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="brandPreference"
                    value={option.value}
                    checked={preferences.brandPreference === option.value}
                    onChange={(e) => updatePreference('brandPreference', e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
            <input
              type="text"
              value={preferences.mustHaveBrands || ''}
              onChange={(e) => updatePreference('mustHaveBrands', e.target.value)}
              placeholder="Must-have brands (optional)"
              className="mt-3 w-full px-3 py-2 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-[#00A862] focus:border-transparent outline-none"
            />
          </div>

          {/* Section 3: Dietary Filters */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Dietary Filters</h3>
            <div className="space-y-2">
              {[
                'GLUTEN_FREE',
                'LACTOSE_FREE',
                'VEGAN',
                'VEGETARIAN',
                'PALEO',
              ].map((filter) => (
                <label
                  key={filter}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.dietaryFilters.includes(filter)
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={preferences.dietaryFilters.includes(filter)}
                    onChange={() => toggleDietaryFilter(filter)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">
                    {filter.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 4: Organic */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Organic Produce</h3>
            <div className="space-y-2">
              {[
                { value: 'always', label: 'Always organic if available' },
                { value: 'sometimes', label: 'Sometimes organic (depends on price)' },
                { value: 'doesnt_matter', label: "Doesn't matter" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.organicImportance === option.value
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="organicImportance"
                    value={option.value}
                    checked={preferences.organicImportance === option.value}
                    onChange={(e) => updatePreference('organicImportance', e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 5: Pack Sizes */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Pack Sizes</h3>
            <div className="space-y-2">
              {[
                { value: 'larger', label: 'Larger packs for better price per unit' },
                { value: 'smaller', label: 'Smaller packs for freshness / storage' },
                { value: 'doesnt_matter', label: "Doesn't matter" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.packSize === option.value
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="packSize"
                    value={option.value}
                    checked={preferences.packSize === option.value}
                    onChange={(e) => updatePreference('packSize', e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Section 6: Substitutions */}
          <div className="mb-8">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Substitutions</h3>
            <div className="space-y-2">
              {[
                { value: 'auto', label: 'Auto-substitute with closest match' },
                { value: 'suggest', label: 'Suggest 2 alternatives and let me pick' },
                { value: 'none', label: "Don't substitute" },
              ].map((option) => (
                <label
                  key={option.value}
                  className={`flex items-center p-3 rounded-xl border-2 cursor-pointer transition-all ${
                    preferences.substitutions === option.value
                      ? 'border-[#00A862] bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    name="substitutions"
                    value={option.value}
                    checked={preferences.substitutions === option.value}
                    onChange={(e) => updatePreference('substitutions', e.target.value as any)}
                    className="mr-3"
                  />
                  <span className="text-sm text-gray-900">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

