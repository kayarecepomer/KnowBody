import React, { useState, useEffect } from 'react';
import { AlertTriangle, X, Info } from 'lucide-react';
import { getAllHealthData } from '../utils/storage';

/**
 * LifeExpectancyPage - Shows effects of behaviors on life expectancy
 * Based on weekly averages with research-backed insights
 */
function LifeExpectancyPage() {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const [weeklyData, setWeeklyData] = useState(null);
  const [userProfile, setUserProfile] = useState(null);

  useEffect(() => {
    // Load user profile
    const profileStr = localStorage.getItem('userProfile');
    if (profileStr) {
      setUserProfile(JSON.parse(profileStr));
    }

    // Calculate weekly averages
    calculateWeeklyAverages();

    // Check if user has seen disclaimer
    const seenDisclaimer = localStorage.getItem('lifeExpectancyDisclaimerSeen');
    if (seenDisclaimer) {
      setShowDisclaimer(false);
    }
  }, []);

  const calculateWeeklyAverages = () => {
    const allData = getAllHealthData();
    if (allData.length === 0) {
      setWeeklyData(null);
      return;
    }

    // Get last 7 days
    const last7Days = allData.slice(0, 7);
    const daysWithData = last7Days.length;

    // Calculate averages
    const avgCigarettes = last7Days.reduce((sum, d) => sum + (d.cigarettes || 0), 0) / daysWithData;
    const avgAlcohol = last7Days.reduce((sum, d) => sum + (d.alcoholDrinks || 0), 0) / daysWithData;
    const avgWater = last7Days.reduce((sum, d) => sum + (d.waterGlasses || 0), 0) / daysWithData;
    const avgSteps = last7Days.reduce((sum, d) => sum + (d.steps || 0), 0) / daysWithData;
    
    // Sleep data (if available)
    const avgSleep = last7Days.reduce((sum, d) => sum + (d.sleepHours || 0), 0) / daysWithData;

    setWeeklyData({
      cigarettes: avgCigarettes,
      alcohol: avgAlcohol,
      water: avgWater,
      steps: avgSteps,
      sleep: avgSleep,
      daysTracked: daysWithData
    });
  };

  const closeDisclaimer = () => {
    setShowDisclaimer(false);
    localStorage.setItem('lifeExpectancyDisclaimerSeen', 'true');
  };

  const getCigaretteEffect = (avgCigarettes, age) => {
    if (avgCigarettes === 0) {
      return {
        status: 'positive',
        message: "Hey looks like you are going well Pal! 🎉",
        details: "Not smoking is one of the best decisions for your health."
      };
    }

    if (avgCigarettes >= 20) {
      const ageNote = age >= 60 ? " At your age, the cumulative effects are especially significant." : "";
      return {
        status: 'critical',
        message: `You're smoking an average of ${avgCigarettes.toFixed(1)} cigarettes per day.`,
        details: `Heavy smoking (20+ cigarettes/day) can reduce life expectancy by 10-13 years on average.${ageNote}`,
        research: {
          title: "Doll et al. (BMJ): 50-year study on smoking and mortality",
          url: "https://www.bmj.com/content/328/7455/1519"
        }
      };
    } else if (avgCigarettes >= 10) {
      return {
        status: 'high',
        message: `You're smoking an average of ${avgCigarettes.toFixed(1)} cigarettes per day.`,
        details: "Smoking 10-19 cigarettes/day can reduce life expectancy by 6-8 years on average.",
        research: {
          title: "Sakata et al. (Tobacco Control): Light smoking risks",
          url: "https://tobaccocontrol.bmj.com/content/21/1/45"
        }
      };
    } else {
      return {
        status: 'medium',
        message: `You're smoking an average of ${avgCigarettes.toFixed(1)} cigarettes per day.`,
        details: "Even light smoking (1-9 cigarettes/day) increases cardiovascular disease risk by 50-60%.",
        research: {
          title: "Hackshaw et al. (BMJ): Light smoking cardiovascular effects",
          url: "https://www.bmj.com/content/360/bmj.j5855"
        }
      };
    }
  };

  const getWaterEffect = (avgWater, age) => {
    if (avgWater >= 8) {
      return {
        status: 'positive',
        message: "Hey looks like you are going well Pal! 💧",
        details: "You're staying well hydrated. Great job!"
      };
    }

    const litersPerDay = (avgWater * 0.25).toFixed(1); // Assuming ~250ml per glass
    
    if (avgWater < 4) {
      const ageWarning = age >= 65 
        ? " Since you are older than 65 years old, chronic dehydration increases your risk of kidney disease and urinary tract infections significantly."
        : " Chronic severe dehydration can lead to kidney stones, urinary tract infections, and impaired cognitive function.";
      
      return {
        status: 'critical',
        message: `In this week you drink an average of less than ${litersPerDay}L of water per day.`,
        details: ageWarning,
        research: {
          title: "Popkin et al. (Nutrition Reviews): Hydration and health",
          url: "https://academic.oup.com/nutritionreviews/article/68/8/439/1841926"
        }
      };
    } else if (avgWater < 6) {
      const ageWarning = age >= 65 
        ? " Since you are older than 65 years old, inadequate hydration affects your cognitive function and increases fall risk."
        : " Inadequate hydration can impair physical and cognitive performance.";
      
      return {
        status: 'medium',
        message: `In this week you drink an average of ${litersPerDay}L of water per day.`,
        details: `You're below the recommended 2L (8 glasses) daily.${ageWarning}`,
        research: {
          title: "Sawka et al. (Journal of Applied Physiology): Hydration effects",
          url: "https://journals.physiology.org/doi/full/10.1152/japplphysiol.00008.2017"
        }
      };
    }

    return {
      status: 'medium',
      message: `You're averaging ${avgWater.toFixed(1)} glasses of water per day.`,
      details: "Getting close to the recommended 8 glasses. Try to drink a bit more!",
      research: {
        title: "IOM (National Academies): Dietary reference intakes for water",
        url: "https://www.nap.edu/read/10925/chapter/1"
      }
    };
  };

  const getAlcoholEffect = (avgAlcohol, age) => {
    if (avgAlcohol === 0) {
      return {
        status: 'positive',
        message: "Hey looks like you are going well Pal! 🎊",
        details: "Not consuming alcohol eliminates alcohol-related health risks."
      };
    }

    if (avgAlcohol >= 4) {
      const ageNote = age >= 60 ? " At your age, the liver's ability to process alcohol decreases, increasing health risks." : "";
      return {
        status: 'critical',
        message: `You're averaging ${avgAlcohol.toFixed(1)} drinks per day.`,
        details: `Heavy drinking (4+ drinks/day) can reduce life expectancy by 5-10 years and significantly increases risk of liver disease, cancer, and cardiovascular issues.${ageNote}`,
        research: {
          title: "Wood et al. (Lancet): Alcohol and mortality",
          url: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)30134-X/fulltext"
        }
      };
    } else if (avgAlcohol >= 2) {
      return {
        status: 'high',
        message: `You're averaging ${avgAlcohol.toFixed(1)} drinks per day.`,
        details: "This exceeds recommended limits (≤2 for men, ≤1 for women). Moderate-heavy drinking increases cancer and cardiovascular disease risk.",
        research: {
          title: "GBD 2016 Alcohol Collaborators (Lancet): Global alcohol burden",
          url: "https://www.thelancet.com/journals/lancet/article/PIIS0140-6736(18)31310-2/fulltext"
        }
      };
    }

    return {
      status: 'medium',
      message: `You're averaging ${avgAlcohol.toFixed(1)} drinks per day.`,
      details: "This is within moderate drinking guidelines, but remember any alcohol carries some health risks.",
      research: {
        title: "Stockwell et al. (Journal of Studies on Alcohol): Moderate drinking myths",
        url: "https://www.jsad.com/doi/10.15288/jsad.2016.77.185"
      }
    };
  };

  const getWalkingEffect = (avgSteps, age) => {
    if (avgSteps >= 10000) {
      return {
        status: 'positive',
        message: "Hey looks like you are going well Pal! 🚶‍♂️",
        details: "You're meeting the 10,000 steps/day goal. Excellent!"
      };
    }

    if (avgSteps === 0) {
      return {
        status: 'no-data',
        message: "No step data available.",
        details: "Import your Apple Health data to see walking insights. Physical inactivity is a major health risk factor."
      };
    }

    if (avgSteps < 5000) {
      const ageNote = age >= 60 
        ? " For older adults, maintaining mobility through regular walking is crucial for independence and longevity."
        : " Sedentary lifestyle is associated with increased mortality risk.";
      
      return {
        status: 'critical',
        message: `You're averaging only ${Math.round(avgSteps)} steps per day.`,
        details: `This is well below the recommended 7,000-10,000 steps/day.${ageNote} Low physical activity can reduce life expectancy by 3-5 years.`,
        research: {
          title: "Lee et al. (JAMA): Steps per day and mortality",
          url: "https://jamanetwork.com/journals/jama/fullarticle/2763292"
        }
      };
    } else if (avgSteps < 7000) {
      return {
        status: 'medium',
        message: `You're averaging ${Math.round(avgSteps)} steps per day.`,
        details: "You're moderately active but below optimal levels. Try to increase by 1,000-2,000 steps.",
        research: {
          title: "Saint-Maurice et al. (JAMA Network): Step count and mortality",
          url: "https://jamanetwork.com/journals/jamanetworkopen/fullarticle/2783711"
        }
      };
    }

    return {
      status: 'low',
      message: `You're averaging ${Math.round(avgSteps)} steps per day.`,
      details: "You're close to the 7,000-10,000 steps/day goal. Keep it up!",
      research: {
        title: "Paluch et al. (Lancet Public Health): Steps and longevity",
        url: "https://www.thelancet.com/journals/lanpub/article/PIIS2468-2667(21)00302-9/fulltext"
      }
    };
  };

  const getSleepEffect = (avgSleep, age) => {
    if (avgSleep === 0) {
      return {
        status: 'no-data',
        message: "No sleep data available.",
        details: "Track your sleep hours to get insights. Sleep is crucial for health and longevity."
      };
    }

    if (avgSleep >= 7 && avgSleep <= 9) {
      return {
        status: 'positive',
        message: "Hey looks like you are going well Pal! 😴",
        details: "You're getting the recommended 7-9 hours of sleep. Great!"
      };
    }

    if (avgSleep < 6) {
      const ageNote = age >= 60 
        ? " Sleep quality and duration are especially important for cognitive health in older adults."
        : "";
      
      return {
        status: 'critical',
        message: `You're averaging ${avgSleep.toFixed(1)} hours of sleep per night.`,
        details: `Chronic sleep deprivation (<6 hours) is associated with increased mortality risk, cardiovascular disease, and cognitive decline.${ageNote}`,
        research: {
          title: "Cappuccio et al. (Sleep): Sleep duration and mortality",
          url: "https://academic.oup.com/sleep/article/33/5/585/2696241"
        }
      };
    } else if (avgSleep < 7) {
      return {
        status: 'medium',
        message: `You're averaging ${avgSleep.toFixed(1)} hours of sleep per night.`,
        details: "You're slightly below the recommended 7-9 hours. Try to get more sleep.",
        research: {
          title: "Watson et al. (Sleep Health): Sleep duration recommendations",
          url: "https://www.sleephealthjournal.org/article/S2352-7218(15)00015-7/fulltext"
        }
      };
    } else if (avgSleep > 9) {
      return {
        status: 'medium',
        message: `You're averaging ${avgSleep.toFixed(1)} hours of sleep per night.`,
        details: "Sleeping more than 9 hours regularly may indicate underlying health issues or excessive sedentary time.",
        research: {
          title: "Liu et al. (Sleep Medicine Reviews): Long sleep duration risks",
          url: "https://www.sciencedirect.com/science/article/abs/pii/S1087079216300764"
        }
      };
    }

    return {
      status: 'low',
      message: `You're averaging ${avgSleep.toFixed(1)} hours of sleep per night.`,
      details: "This is within a reasonable range. Sleep quality is also important!"
    };
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'positive': return '#4CAF50';
      case 'low': return '#8BC34A';
      case 'medium': return '#FF9800';
      case 'high': return '#FF5722';
      case 'critical': return '#f44336';
      case 'no-data': return '#9E9E9E';
      default: return '#666';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'positive': return '✅';
      case 'low': return '🙂';
      case 'medium': return '⚠️';
      case 'high': return '🔴';
      case 'critical': return '🚨';
      case 'no-data': return 'ℹ️';
      default: return '•';
    }
  };

  if (!weeklyData) {
    return (
      <div style={styles.container}>
        <h1 style={styles.pageTitle}>Life Expectancy Effects</h1>
        <div style={styles.noData}>
          <Info size={64} color="#666" />
          <h2>No Data Available</h2>
          <p>Start tracking your health metrics to see how your behaviors affect your life expectancy.</p>
        </div>
      </div>
    );
  }

  const age = userProfile?.age || 30;
  const effects = [
    { icon: '🚬', title: 'Cigarettes', effect: getCigaretteEffect(weeklyData.cigarettes, age) },
    { icon: '💧', title: 'Water Intake', effect: getWaterEffect(weeklyData.water, age) },
    { icon: '🍷', title: 'Alcohol', effect: getAlcoholEffect(weeklyData.alcohol, age) },
    { icon: '🚶', title: 'Walking (Steps)', effect: getWalkingEffect(weeklyData.steps, age) },
    { icon: '😴', title: 'Sleep', effect: getSleepEffect(weeklyData.sleep, age) }
  ];

  return (
    <div style={styles.container}>
      {showDisclaimer && (
        <div style={styles.disclaimerOverlay}>
          <div style={styles.disclaimerModal}>
            <button style={styles.closeButton} onClick={closeDisclaimer}>
              <X size={24} />
            </button>
            
            <div style={styles.disclaimerHeader}>
              <AlertTriangle size={48} color="#FF9800" />
              <h2 style={styles.disclaimerTitle}>Important Disclaimer</h2>
            </div>
            
            <div style={styles.disclaimerContent}>
              <p>
                <strong>This program can never know your life expectancy.</strong>
              </p>
              <p>
                These are just average results based on hand-picked medical research studies. 
                Individual results vary greatly based on genetics, medical history, environment, 
                and many other factors.
              </p>
              <p>
                This information is for educational purposes only and should not replace 
                professional medical advice.
              </p>
              <p style={styles.disclaimerEmphasis}>
                <strong>If you are worried about your health, please consult your doctor.</strong>
              </p>
            </div>
            
            <button style={styles.disclaimerButton} onClick={closeDisclaimer}>
              I Understand
            </button>
          </div>
        </div>
      )}

      <h1 style={styles.pageTitle}>Life Expectancy Effects</h1>
      <p style={styles.pageDescription}>
        Based on your weekly averages (last {weeklyData.daysTracked} days)
      </p>

      <div style={styles.effectsGrid}>
        {effects.map((item, index) => (
          <div 
            key={index}
            style={{
              ...styles.effectCard,
              borderLeft: `6px solid ${getStatusColor(item.effect.status)}`
            }}
          >
            <div style={styles.cardHeader}>
              <span style={styles.cardIcon}>{item.icon}</span>
              <h3 style={styles.cardTitle}>{item.title}</h3>
              <span style={styles.statusIcon}>{getStatusIcon(item.effect.status)}</span>
            </div>
            
            <div style={styles.cardContent}>
              <p style={styles.effectMessage}>{item.effect.message}</p>
              <p style={styles.effectDetails}>{item.effect.details}</p>
              
              {item.effect.research && (
                <a 
                  href={item.effect.research.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={styles.researchLink}
                >
                  📚 {item.effect.research.title}
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div style={styles.infoFooter}>
        <Info size={20} />
        <span>
          Click on any research link to read the full study. 
          All recommendations are based on peer-reviewed medical research.
        </span>
      </div>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '20px'
  },
  pageTitle: {
    textAlign: 'center',
    color: '#333',
    fontSize: '2em',
    marginBottom: '10px'
  },
  pageDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: '1.1em',
    marginBottom: '30px'
  },
  noData: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666'
  },
  disclaimerOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000
  },
  disclaimerModal: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '30px',
    maxWidth: '600px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
    position: 'relative'
  },
  closeButton: {
    position: 'absolute',
    top: '15px',
    right: '15px',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    color: '#666'
  },
  disclaimerHeader: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  disclaimerTitle: {
    fontSize: '24px',
    color: '#333',
    marginTop: '15px'
  },
  disclaimerContent: {
    lineHeight: '1.8',
    color: '#333',
    fontSize: '16px'
  },
  disclaimerEmphasis: {
    backgroundColor: '#fff3e0',
    padding: '15px',
    borderRadius: '8px',
    marginTop: '15px',
    color: '#e65100'
  },
  disclaimerButton: {
    width: '100%',
    backgroundColor: '#4CAF50',
    color: 'white',
    border: 'none',
    padding: '15px',
    fontSize: '18px',
    fontWeight: 'bold',
    borderRadius: '8px',
    cursor: 'pointer',
    marginTop: '20px'
  },
  effectsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '20px',
    marginBottom: '30px'
  },
  effectCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '15px'
  },
  cardIcon: {
    fontSize: '32px'
  },
  cardTitle: {
    margin: 0,
    flex: 1,
    fontSize: '18px',
    color: '#333'
  },
  statusIcon: {
    fontSize: '24px'
  },
  cardContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  effectMessage: {
    fontWeight: '600',
    color: '#333',
    margin: 0
  },
  effectDetails: {
    color: '#666',
    fontSize: '14px',
    margin: 0,
    lineHeight: '1.5'
  },
  researchLink: {
    display: 'inline-block',
    marginTop: '10px',
    padding: '8px 12px',
    backgroundColor: '#e3f2fd',
    borderRadius: '6px',
    textDecoration: 'none',
    color: '#1976d2',
    fontSize: '14px',
    transition: 'background-color 0.2s'
  },
  infoFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    backgroundColor: '#e3f2fd',
    padding: '15px',
    borderRadius: '8px',
    color: '#1976d2',
    fontSize: '14px'
  }
};

export default LifeExpectancyPage;
