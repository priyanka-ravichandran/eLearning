import React, { useState, useEffect } from 'react';
import { Modal, Button, Card, Row, Col, Badge, Alert, Spinner, Tab, Nav } from 'react-bootstrap';
import './index.css';

const API_BASE = "http://localhost:3000";

const AvatarShop = ({ show, onHide, studentDetails, onAvatarUpdate }) => {
  const [shopData, setShopData] = useState(null);
  const [userAvatarData, setUserAvatarData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('seeds');
  const [currentAvatar, setCurrentAvatar] = useState({
    seed: 'sarah',
    hair: null,
    eyes: null,
    facialHair: null,
    mouth: null,
    body: null
  });
  const [previewAvatar, setPreviewAvatar] = useState({});

  // Fetch shop data and user avatar data
  useEffect(() => {
    if (show && studentDetails?.student?._id) {
      fetchShopData();
      fetchUserAvatarData();
    }
  }, [show, studentDetails]);

  const fetchShopData = async () => {
    try {
      const response = await fetch(`${API_BASE}/avatar/shop`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      const data = await response.json();
      if (data.status) {
        setShopData(data.data);
      } else {
        setError('Failed to load shop data');
      }
    } catch (err) {
      setError('Error connecting to shop');
    }
  };

  const fetchUserAvatarData = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/avatar/my-avatar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentDetails.student._id,
        }),
      });
      const data = await response.json();
      if (data.status) {
        setUserAvatarData(data.data);
        setCurrentAvatar(data.data.avatar || {
          seed: 'sarah',
          hair: null,
          eyes: null,
          facialHair: null,
          mouth: null,
          body: null
        });
        setPreviewAvatar(data.data.avatar || {});
      } else {
        setError('Failed to load avatar data');
      }
    } catch (err) {
      setError('Error loading avatar data');
    } finally {
      setLoading(false);
    }
  };

  const generateAvatarUrl = (config) => {
    const baseUrl = 'https://api.dicebear.com/9.x/personas/svg';
    const params = new URLSearchParams();
    
    if (config.seed) params.append('seed', config.seed);
    if (config.hair) params.append('hair', config.hair);
    if (config.eyes) params.append('eyes', config.eyes);
    if (config.facialHair) params.append('facialHair', config.facialHair);
    if (config.mouth) params.append('mouth', config.mouth);
    if (config.body) params.append('body', config.body);
    
    return `${baseUrl}?${params.toString()}`;
  };

  const purchaseItem = async (category, itemKey) => {
    try {
      setPurchasing(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/avatar/purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentDetails.student._id,
          category,
          itemKey,
        }),
      });
      
      const data = await response.json();
      if (data.status) {
        setSuccess(`Successfully purchased ${data.data.item.name}!`);
        // Refresh avatar data
        await fetchUserAvatarData();
        // Update parent component
        if (onAvatarUpdate) {
          onAvatarUpdate();
        }
      } else {
        setError(data.message || 'Purchase failed');
      }
    } catch (err) {
      setError('Error during purchase');
    } finally {
      setPurchasing(false);
    }
  };

  const updateAvatar = async () => {
    try {
      setUpdating(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/avatar/update`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: studentDetails.student._id,
          ...previewAvatar,
        }),
      });
      
      const data = await response.json();
      if (data.status) {
        setSuccess('Avatar updated successfully!');
        setCurrentAvatar(data.data.avatar);
        // Update parent component
        if (onAvatarUpdate) {
          onAvatarUpdate();
        }
      } else {
        setError(data.message || 'Update failed');
      }
    } catch (err) {
      setError('Error updating avatar');
    } finally {
      setUpdating(false);
    }
  };

  const equipItem = (category, itemKey) => {
    setPreviewAvatar(prev => {
      const newPreview = { ...prev };
      
      // Handle category name mapping for seeds
      if (category === 'seeds') {
        newPreview.seed = itemKey;
      } else {
        newPreview[category] = itemKey;
      }
      
      return newPreview;
    });
  };

  const isItemOwned = (category, itemKey) => {
    if (category === 'seeds') {
      return itemKey === 'sarah' || userAvatarData?.purchasedItems?.seeds?.includes(itemKey);
    }
    return userAvatarData?.purchasedItems?.[category]?.includes(itemKey);
  };

  const isItemEquipped = (category, itemKey) => {
    if (category === 'seeds') {
      return previewAvatar.seed === itemKey;
    }
    return previewAvatar[category] === itemKey;
  };

  const canAfford = (price) => {
    return userAvatarData?.currentPoints >= price;
  };

  const renderShopItems = (category, items) => {
    if (!items) return null;

    return (
      <Row className="g-3">
        {Object.entries(items).map(([key, item]) => {
          const owned = isItemOwned(category, key);
          const equipped = isItemEquipped(category, key);
          const affordable = canAfford(item.price);

          return (
            <Col xs={6} md={4} lg={3} key={key}>
              <Card className={`shop-item ${equipped ? 'equipped' : ''} ${owned ? 'owned' : ''}`}>
                <Card.Body className="text-center p-2">
                  <div className="item-preview">
                    <img
                      src={generateAvatarUrl({ 
                        seed: category === 'seeds' ? key : 'sarah',
                        [category]: category === 'seeds' ? null : key
                      })}
                      alt={item.name}
                      className="avatar-preview"
                    />
                  </div>
                  <Card.Title className="item-name">{item.name}</Card.Title>
                  {item.gender && (
                    <Badge bg={item.gender === 'girl' ? 'pink' : 'blue'} className="mb-2">
                      {item.gender}
                    </Badge>
                  )}
                  <div className="item-price">
                    {item.price === 0 ? (
                      <Badge bg="success">FREE</Badge>
                    ) : (
                      <Badge bg="warning">{item.price} pts</Badge>
                    )}
                  </div>
                  <div className="item-actions mt-2">
                    {owned ? (
                      <>
                        {equipped ? (
                          <Badge bg="success">Equipped</Badge>
                        ) : (
                          <Button 
                            size="sm" 
                            variant="outline-primary"
                            onClick={() => equipItem(category, key)}
                          >
                            Equip
                          </Button>
                        )}
                      </>
                    ) : (
                      <Button
                        size="sm"
                        variant={affordable ? "primary" : "outline-secondary"}
                        disabled={!affordable || purchasing || item.price === 0}
                        onClick={() => purchaseItem(category, key)}
                      >
                        {purchasing ? 'Buying...' : 'Buy'}
                      </Button>
                    )}
                  </div>
                </Card.Body>
              </Card>
            </Col>
          );
        })}
      </Row>
    );
  };

  if (loading) {
    return (
      <Modal show={show} onHide={onHide} size="lg" centered>
        <Modal.Body className="text-center py-5">
          <Spinner animation="border" role="status" />
          <p className="mt-3">Loading Avatar Shop...</p>
        </Modal.Body>
      </Modal>
    );
  }

  return (
    <Modal show={show} onHide={onHide} size="xl" centered>
      <Modal.Header closeButton>
        <Modal.Title>🎭 Avatar Customization Shop</Modal.Title>
      </Modal.Header>
      
      <Modal.Body>
        {error && (
          <Alert variant="danger" dismissible onClose={() => setError('')}>
            {error}
          </Alert>
        )}
        
        {success && (
          <Alert variant="success" dismissible onClose={() => setSuccess('')}>
            {success}
          </Alert>
        )}

        {/* Current Avatar & Points */}
        <Row className="mb-4">
          <Col md={6}>
            <Card>
              <Card.Header>Current Avatar</Card.Header>
              <Card.Body className="text-center">
                <img
                  src={generateAvatarUrl(currentAvatar)}
                  alt="Current Avatar"
                  className="current-avatar"
                />
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card>
              <Card.Header>Preview</Card.Header>
              <Card.Body className="text-center">
                <img
                  src={generateAvatarUrl(previewAvatar)}
                  alt="Preview Avatar"
                  className="preview-avatar"
                />
                <div className="mt-3">
                  <Button 
                    variant="success" 
                    disabled={updating}
                    onClick={updateAvatar}
                  >
                    {updating ? 'Updating...' : 'Apply Changes'}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>

        {/* Points Display */}
        <div className="points-display mb-3">
          <Badge bg="warning" className="fs-6">
            💰 Your Points: {userAvatarData?.currentPoints || 0}
          </Badge>
        </div>

        {/* Shop Categories */}
        <Tab.Container activeKey={activeTab} onSelect={setActiveTab}>
          <Nav variant="pills" className="mb-3">
            <Nav.Item>
              <Nav.Link eventKey="seeds">🎭 Characters</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="hair">💇 Hair</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="eyes">👀 Eyes</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="facialHair">🧔 Facial Hair</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="mouth">😊 Mouth</Nav.Link>
            </Nav.Item>
            <Nav.Item>
              <Nav.Link eventKey="body">👕 Body</Nav.Link>
            </Nav.Item>
          </Nav>

          <Tab.Content>
            <Tab.Pane eventKey="seeds">
              <h5>Character Personas</h5>
              <p className="text-muted">Choose your base character. Sarah is free for everyone!</p>
              {renderShopItems('seeds', shopData?.shop?.seeds)}
            </Tab.Pane>

            <Tab.Pane eventKey="hair">
              <h5>Hair Styles</h5>
              <p className="text-muted">Customize your character's hairstyle</p>
              {renderShopItems('hair', shopData?.shop?.hair)}
            </Tab.Pane>

            <Tab.Pane eventKey="eyes">
              <h5>Eye Styles</h5>
              <p className="text-muted">Change your character's eyes and glasses</p>
              {renderShopItems('eyes', shopData?.shop?.eyes)}
            </Tab.Pane>

            <Tab.Pane eventKey="facialHair">
              <h5>Facial Hair</h5>
              <p className="text-muted">Add beards, mustaches, and more</p>
              {renderShopItems('facialHair', shopData?.shop?.facialHair)}
            </Tab.Pane>

            <Tab.Pane eventKey="mouth">
              <h5>Mouth Expressions</h5>
              <p className="text-muted">Set your character's expression</p>
              {renderShopItems('mouth', shopData?.shop?.mouth)}
            </Tab.Pane>

            <Tab.Pane eventKey="body">
              <h5>Body Styles</h5>
              <p className="text-muted">Choose your character's body type</p>
              {renderShopItems('body', shopData?.shop?.body)}
            </Tab.Pane>
          </Tab.Content>
        </Tab.Container>
      </Modal.Body>

      <Modal.Footer>
        <Button variant="secondary" onClick={onHide}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
};

export default AvatarShop;
