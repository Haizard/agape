import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Box, Fade, Grow, Slide, Zoom, Collapse, styled } from '@mui/material';

/**
 * Enhanced Animation Components
 * 
 * A collection of animation components for creating engaging user interfaces.
 */

/**
 * FadeIn - A component that fades in its children
 */
export const FadeIn = ({ children, timeout = 500, delay = 0, ...props }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Fade in={show} timeout={timeout} {...props}>
      <div>{children}</div>
    </Fade>
  );
};

FadeIn.propTypes = {
  children: PropTypes.node.isRequired,
  timeout: PropTypes.number,
  delay: PropTypes.number,
};

/**
 * GrowIn - A component that grows in its children
 */
export const GrowIn = ({ children, timeout = 500, delay = 0, ...props }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Grow in={show} timeout={timeout} {...props}>
      <div>{children}</div>
    </Grow>
  );
};

GrowIn.propTypes = {
  children: PropTypes.node.isRequired,
  timeout: PropTypes.number,
  delay: PropTypes.number,
};

/**
 * SlideIn - A component that slides in its children
 */
export const SlideIn = ({ children, direction = 'up', timeout = 500, delay = 0, ...props }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Slide direction={direction} in={show} timeout={timeout} {...props}>
      <div>{children}</div>
    </Slide>
  );
};

SlideIn.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  timeout: PropTypes.number,
  delay: PropTypes.number,
};

/**
 * ZoomIn - A component that zooms in its children
 */
export const ZoomIn = ({ children, timeout = 500, delay = 0, ...props }) => {
  const [show, setShow] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(true);
    }, delay);
    
    return () => clearTimeout(timer);
  }, [delay]);
  
  return (
    <Zoom in={show} timeout={timeout} {...props}>
      <div>{children}</div>
    </Zoom>
  );
};

ZoomIn.propTypes = {
  children: PropTypes.node.isRequired,
  timeout: PropTypes.number,
  delay: PropTypes.number,
};

/**
 * SequentialFade - A component that fades in its children sequentially
 */
export const SequentialFade = ({ children, baseDelay = 100, timeout = 500, ...props }) => {
  return React.Children.map(children, (child, index) => (
    <FadeIn delay={baseDelay * index} timeout={timeout} {...props}>
      {child}
    </FadeIn>
  ));
};

SequentialFade.propTypes = {
  children: PropTypes.node.isRequired,
  baseDelay: PropTypes.number,
  timeout: PropTypes.number,
};

/**
 * SequentialSlide - A component that slides in its children sequentially
 */
export const SequentialSlide = ({ children, direction = 'up', baseDelay = 100, timeout = 500, ...props }) => {
  return React.Children.map(children, (child, index) => (
    <SlideIn direction={direction} delay={baseDelay * index} timeout={timeout} {...props}>
      {child}
    </SlideIn>
  ));
};

SequentialSlide.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['up', 'down', 'left', 'right']),
  baseDelay: PropTypes.number,
  timeout: PropTypes.number,
};

/**
 * AnimatedBox - A box with CSS animations
 */
export const AnimatedBox = styled(Box)(({ theme, animation, duration = 0.5, delay = 0, iterationCount = 1 }) => {
  const getKeyframes = () => {
    switch (animation) {
      case 'fadeIn':
        return `
          @keyframes fadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
          }
        `;
      case 'slideUp':
        return `
          @keyframes slideUp {
            from { transform: translateY(20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `;
      case 'slideDown':
        return `
          @keyframes slideDown {
            from { transform: translateY(-20px); opacity: 0; }
            to { transform: translateY(0); opacity: 1; }
          }
        `;
      case 'slideLeft':
        return `
          @keyframes slideLeft {
            from { transform: translateX(20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
      case 'slideRight':
        return `
          @keyframes slideRight {
            from { transform: translateX(-20px); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
          }
        `;
      case 'zoomIn':
        return `
          @keyframes zoomIn {
            from { transform: scale(0.9); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `;
      case 'bounce':
        return `
          @keyframes bounce {
            0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
            40% { transform: translateY(-20px); }
            60% { transform: translateY(-10px); }
          }
        `;
      case 'pulse':
        return `
          @keyframes pulse {
            0% { transform: scale(1); }
            50% { transform: scale(1.05); }
            100% { transform: scale(1); }
          }
        `;
      case 'shake':
        return `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
            20%, 40%, 60%, 80% { transform: translateX(5px); }
          }
        `;
      case 'rotate':
        return `
          @keyframes rotate {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
        `;
      default:
        return '';
    }
  };
  
  return {
    animation: animation ? `${animation} ${duration}s ${theme.transitions.easing.easeInOut} ${delay}s ${iterationCount}` : 'none',
    ...getKeyframes(),
  };
});

AnimatedBox.propTypes = {
  animation: PropTypes.oneOf([
    'fadeIn',
    'slideUp',
    'slideDown',
    'slideLeft',
    'slideRight',
    'zoomIn',
    'bounce',
    'pulse',
    'shake',
    'rotate',
  ]),
  duration: PropTypes.number,
  delay: PropTypes.number,
  iterationCount: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
};

/**
 * AnimatedList - A component that animates a list of items
 */
export const AnimatedList = ({
  children,
  animation = 'fadeIn',
  baseDelay = 0.1,
  duration = 0.5,
  staggered = true,
  ...props
}) => {
  return React.Children.map(children, (child, index) => (
    <AnimatedBox
      animation={animation}
      duration={duration}
      delay={staggered ? baseDelay * index : 0}
      {...props}
    >
      {child}
    </AnimatedBox>
  ));
};

AnimatedList.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf([
    'fadeIn',
    'slideUp',
    'slideDown',
    'slideLeft',
    'slideRight',
    'zoomIn',
    'bounce',
    'pulse',
    'shake',
    'rotate',
  ]),
  baseDelay: PropTypes.number,
  duration: PropTypes.number,
  staggered: PropTypes.bool,
};

/**
 * AnimatedOnScroll - A component that animates when scrolled into view
 */
export const AnimatedOnScroll = ({ children, animation = 'fadeIn', duration = 0.5, threshold = 0.1, ...props }) => {
  const [isVisible, setIsVisible] = useState(false);
  const domRef = React.useRef();
  
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold }
    );
    
    const { current } = domRef;
    if (current) {
      observer.observe(current);
    }
    
    return () => {
      if (current) {
        observer.unobserve(current);
      }
    };
  }, [threshold]);
  
  return (
    <div ref={domRef}>
      <AnimatedBox
        animation={isVisible ? animation : undefined}
        duration={duration}
        sx={{ opacity: isVisible ? 1 : 0 }}
        {...props}
      >
        {children}
      </AnimatedBox>
    </div>
  );
};

AnimatedOnScroll.propTypes = {
  children: PropTypes.node.isRequired,
  animation: PropTypes.oneOf([
    'fadeIn',
    'slideUp',
    'slideDown',
    'slideLeft',
    'slideRight',
    'zoomIn',
    'bounce',
    'pulse',
    'shake',
    'rotate',
  ]),
  duration: PropTypes.number,
  threshold: PropTypes.number,
};

// Export all animation components
export default {
  FadeIn,
  GrowIn,
  SlideIn,
  ZoomIn,
  SequentialFade,
  SequentialSlide,
  AnimatedBox,
  AnimatedList,
  AnimatedOnScroll,
};
