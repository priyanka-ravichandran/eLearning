import React from 'react';
import { Badge } from 'react-bootstrap';
import './index.css';
import { createAvatar } from '@dicebear/core';
import { avataaars } from '@dicebear/collection';

const AvatarDisplay = ({ 
  studentName, 
  userAvatar, 
  userPoints, 
  onAvatarClick, 
  size = 90,
  showShopIcon = true,
  showClickHint = true 
}) => {
  // Use a friendly human preset for default avatar
  const defaultPreset = {
    hair: 'short01', // short hair
    eyes: 'default', // open eyes
    body: 'shirt',   // shirt
    accessory: ''    // no accessory
  };

  // Merge userAvatar with defaultPreset for DiceBear
  const avatarConfig = {
    hair: userAvatar?.hair && userAvatar.hair !== 'default' ? userAvatar.hair : defaultPreset.hair,
    eyes: userAvatar?.eyes && userAvatar.eyes !== 'default' ? userAvatar.eyes : defaultPreset.eyes,
    body: userAvatar?.body && userAvatar.body !== 'default' ? userAvatar.body : defaultPreset.body,
    accessory: userAvatar?.accessory && userAvatar.accessory !== 'none' ? userAvatar.accessory : defaultPreset.accessory
  };

  // Determine background for default vs custom
  const isDefaultAvatar = (
    avatarConfig.hair === defaultPreset.hair &&
    avatarConfig.eyes === defaultPreset.eyes &&
    avatarConfig.body === defaultPreset.body &&
    (!avatarConfig.accessory || avatarConfig.accessory === defaultPreset.accessory)
  );

  // DiceBear options mapping
  const dicebearOptions = {
    seed: studentName || 'default',
    style: {
      top: mapHairStyle(avatarConfig.hair),
      eyes: mapEyeStyle(avatarConfig.eyes),
      clothes: mapClothingStyle(avatarConfig.body),
      accessories: mapAccessoryStyle(avatarConfig.accessory),
      accessoriesProbability: avatarConfig.accessory ? 100 : 0,
      backgroundColor: isDefaultAvatar ? '#ffffff' : 'transparent',
    }
  };

  function mapHairStyle(hair) {
    const mapping = {
      'default': 'short01',
      'short01': 'short01',
      'cool_hair': 'short02', 
      'punk_hair': 'short19',
      'long_hair': 'long01',
      'curly_hair': 'short11',
      'wavy_hair': 'short17'
    };
    return mapping[hair] || 'short01';
  }
  function mapEyeStyle(eyes) {
    const mapping = {
      'default': 'default',
      'cool_eyes': 'squint',
      'star_eyes': 'hearts', 
      'heart_eyes': 'hearts',
      'sleepy_eyes': 'close'
    };
    return mapping[eyes] || 'default';
  }
  function mapClothingStyle(body) {
    const mapping = {
      'default': 'shirt',
      'shirt': 'shirt',
      'casual_shirt': 'shirtCrewNeck',
      'formal_suit': 'blazer',
      'hoodie': 'hoodie',
      'tshirt': 'shirtScoopNeck'
    };
    return mapping[body] || 'shirt';
  }
  function mapAccessoryStyle(accessory) {
    const mapping = {
      'none': undefined,
      '': undefined,
      'sunglasses': 'sunglasses',
      'glasses': 'eyepatch',
      'hat': 'hat',
      'crown': 'hat',
      'headphones': undefined
    };
    return mapping[accessory] || undefined;
  }

  // Generate SVG using DiceBear npm package
  const avatar = createAvatar(avataaars, dicebearOptions);
  const svg = avatar.toString();

  const renderAvatar = () => (
    <div 
      onClick={onAvatarClick} 
      style={{ cursor: 'pointer', position: 'relative', width: size, height: size }}
      title="Click to customize avatar"
    >
      <div
        style={{ width: size, height: size }}
        dangerouslySetInnerHTML={{ __html: svg }}
      />
      {showShopIcon && (
        <div className="avatar-shop-icon">
          🛍️
        </div>
      )}
    </div>
  );

  return (
    <div className="avatar-display">
      {renderAvatar()}
      {showClickHint && (
        <div className="text-muted small mt-2">🛍️ Click to customize avatar</div>
      )}
    </div>
  );
};

export default AvatarDisplay;