import React, { useState, useEffect } from 'react';
import { BASEURL_PROD } from '../constants';

const WorkshopRevenueTable = ({ workshopId }) => {
  const [revenueData, setRevenueData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchRevenueData = async () => {
      try {
        setLoading(true);
        const url = `${BASEURL_PROD}payments/workshop_revenue/${workshopId}`;
        console.log(url);
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.success) {
          setRevenueData(data.data);
        } else {
          setError(data.message || 'Failed to fetch revenue data');
        }
      } catch (err) {
        setError('Error fetching revenue data: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (workshopId) {
      fetchRevenueData();
    }
  }, [workshopId]);

  const calculateTotals = (workshopData) => {
    let totalRevenue = 0;
    let totalTickets = 0;
    let totalCapacity = 0;

    Object.values(workshopData).forEach(variant => {
      Object.values(variant).forEach(subvariant => {
        if (typeof subvariant === 'object' && subvariant.price !== undefined) {
          totalRevenue += subvariant.subtotal;
          totalTickets += subvariant.quantity;
          totalCapacity += subvariant.capacity;
        }
      });
    });

    return { totalRevenue, totalTickets, totalCapacity };
  };

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>Loading revenue data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', textAlign: 'center', color: 'red' }}>
        <p>Error: {error}</p>
      </div>
    );
  }

  if (!revenueData || !revenueData[workshopId]) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <p>No revenue data found for this workshop.</p>
      </div>
    );
  }

  const workshopData = revenueData[workshopId];
  const { totalRevenue, totalTickets, totalCapacity } = calculateTotals(workshopData);

  return (
    <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2 style={{ textTransform: 'none' }}>Workshop Revenue Table</h2>
      <p>Workshop ID: {workshopId}</p>
      
      {/* Summary Stats */}
      <div style={{ margin: '20px 0', display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <strong>Total Revenue:</strong> ₹{totalRevenue.toLocaleString()}
        </div>
        <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <strong>Tickets Sold:</strong> {totalTickets}
        </div>
        <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <strong>Total Capacity:</strong> {totalCapacity}
        </div>
        <div style={{ padding: '10px', border: '1px solid #ccc', borderRadius: '4px', backgroundColor: '#f9f9f9' }}>
          <strong>Fill Rate:</strong> {totalCapacity > 0 ? ((totalTickets / totalCapacity) * 100).toFixed(1) : 0}%
        </div>
      </div>

      {/* Revenue Table */}
      <div style={{ overflowX: 'auto', marginTop: '20px' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ccc', minWidth: '800px' }}>
          <thead>
            <tr style={{ backgroundColor: '#f5f5f5' }}>
              <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left', textTransform: 'none', fontWeight: 'bold' }}>
                Workshop Event
              </th>
              <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'left', textTransform: 'none', fontWeight: 'bold' }}>
                Event Price Tier
              </th>
              <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center', textTransform: 'none', fontWeight: 'bold' }}>
                Price
              </th>
              <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center', textTransform: 'none', fontWeight: 'bold' }}>
                Capacity
              </th>
              <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center', textTransform: 'none', fontWeight: 'bold' }}>
                Sold
              </th>
              <th style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center', textTransform: 'none', fontWeight: 'bold' }}>
                Revenue
              </th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(workshopData).map(([variantId, variant]) => {
              const variantDescription = variant.variant_description;
              const subvariants = Object.entries(variant).filter(([key, value]) => 
                typeof value === 'object' && value.price !== undefined
              );

              return subvariants.map(([subvariantId, subvariant], index) => (
                <tr key={`${variantId}-${subvariantId}`} style={{ backgroundColor: index % 2 === 0 ? '#ffffff' : '#f9f9f9' }}>
                  {index === 0 && (
                    <td 
                      rowSpan={subvariants.length} 
                      style={{ 
                        border: '1px solid #ccc', 
                        padding: '12px', 
                        verticalAlign: 'top',
                        backgroundColor: '#e8f4f8'
                      }}
                    >
                      <strong>{variantDescription}</strong><br/>
                      <small style={{ color: '#666' }}>ID: {variantId}</small>
                    </td>
                  )}
                  <td style={{ border: '1px solid #ccc', padding: '12px' }}>
                    <strong>{subvariant.subvariant_description}</strong><br/>
                    <small style={{ color: '#666' }}>ID: {subvariantId}</small>
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                    ₹{subvariant.price.toLocaleString()}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                    {subvariant.capacity}
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                    <span style={{ 
                      color: subvariant.quantity === subvariant.capacity ? '#d32f2f' : 
                             subvariant.quantity > subvariant.capacity * 0.8 ? '#f57c00' : '#388e3c',
                      fontWeight: 'bold'
                    }}>
                      {subvariant.quantity}
                    </span>
                  </td>
                  <td style={{ border: '1px solid #ccc', padding: '12px', textAlign: 'center' }}>
                    <strong style={{ color: '#1976d2' }}>₹{subvariant.subtotal.toLocaleString()}</strong>
                  </td>
                </tr>
              ));
            })}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '12px', color: '#666' }}>
        <p>Data last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default WorkshopRevenueTable;















