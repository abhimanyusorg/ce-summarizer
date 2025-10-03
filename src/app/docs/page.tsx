'use client';

import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function DocsPage() {
  return (
    <div>
      <SwaggerUI url="/api/docs" />
    </div>
  );
}