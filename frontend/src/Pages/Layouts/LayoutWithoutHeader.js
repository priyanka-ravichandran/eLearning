/* author: Mehulkumar Bhunsadiya */
import React from 'react';
import { Outlet } from 'react-router-dom';

function LayoutWithoutHeader() {
    return (
        <>
           <Outlet />
        </>
    );
}

export default LayoutWithoutHeader;