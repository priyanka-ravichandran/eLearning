import React, { useState } from 'react';
import { Card, Container, Row, Col } from 'react-bootstrap';
import EmojiReactions from '../EmojiReactions';

const EmojiReactionsDemo = () => {
  const [demoReactions1] = useState({
    like: 12,
    love: 8,
    wow: 5,
    laugh: 3,
    care: 2,
    sad: 1,
    angry: 0
  });

  const [demoReactions2] = useState({
    like: 25,
    love: 15,
    laugh: 10,
    wow: 7,
    care: 3,
    sad: 2,
    angry: 1
  });

  // Mock user ID for demo
  const currentUserId = "demo-user-123";

  return (
    <Container className="py-4">
      <h2>Emoji Reactions Demo</h2>
      <p>This shows different ways to implement emoji reactions with counts.</p>
      
      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <strong>Example Answer by Carol</strong>
            </Card.Header>
            <Card.Body>
              <p>The Civil War erupted primarily due to deep-seated tensions over slavery, exacerbated by economic disparities and differing political ideologies between the Northern and Southern states.</p>
              
              {/* Medium sized reactions with counts */}
              <EmojiReactions
                postId="answer-123"
                postType="answer"
                currentUserId={currentUserId}
                initialReactions={demoReactions1}
                onReactionUpdate={(reactions) => console.log('Updated reactions:', reactions)}
                showCounts={true}
                size="md"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <strong>Example Answer by John</strong>
            </Card.Header>
            <Card.Body>
              <p>The key factors included economic differences between industrial North and agricultural South, political disagreements over federal vs. state rights, and the moral question of slavery expansion into new territories.</p>
              
              {/* Large sized reactions with counts */}
              <EmojiReactions
                postId="answer-456"
                postType="answer"
                currentUserId={currentUserId}
                initialReactions={demoReactions2}
                onReactionUpdate={(reactions) => console.log('Updated reactions:', reactions)}
                showCounts={true}
                size="lg"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row>
        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <strong>Small Size Example</strong>
            </Card.Header>
            <Card.Body>
              <p>This is a shorter comment or answer with compact reactions.</p>
              
              {/* Small sized reactions */}
              <EmojiReactions
                postId="comment-789"
                postType="comment"
                currentUserId={currentUserId}
                initialReactions={{ like: 5, love: 2, laugh: 1 }}
                showCounts={true}
                size="sm"
              />
            </Card.Body>
          </Card>
        </Col>

        <Col md={6}>
          <Card className="mb-4">
            <Card.Header>
              <strong>No Counts Version</strong>
            </Card.Header>
            <Card.Body>
              <p>This version doesn't show counts, just the emoji reactions.</p>
              
              {/* No counts version */}
              <EmojiReactions
                postId="post-999"
                postType="question"
                currentUserId={currentUserId}
                initialReactions={{ like: 3, wow: 1 }}
                showCounts={false}
                size="md"
              />
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <div className="mt-4">
        <h4>Usage Examples:</h4>
        <pre className="bg-light p-3">
{`// Basic usage with counts
<EmojiReactions
  postId="unique-post-id"
  postType="answer" // or "question", "comment"
  currentUserId={userData._id}
  initialReactions={{ like: 5, love: 2 }}
  showCounts={true}
  size="md"
/>

// Without counts (just emoji buttons)
<EmojiReactions
  postId="unique-post-id"
  postType="answer"
  currentUserId={userData._id}
  showCounts={false}
  size="sm"
/>

// With callback for reaction updates
<EmojiReactions
  postId="unique-post-id"
  postType="answer"
  currentUserId={userData._id}
  onReactionUpdate={(newReactions) => {
    console.log('Reactions updated:', newReactions);
    // Update parent component state if needed
  }}
/>`}
        </pre>
      </div>
    </Container>
  );
};

export default EmojiReactionsDemo;
