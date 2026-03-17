import { Alert, Button, Card, Result, Space, Typography } from "antd";
import type { ReactNode } from "react";
import { Component } from "react";
import { useLocation, useNavigate } from "react-router";

type ErrorBoundaryProps = {
  children: ReactNode;
  resetKey: string;
  onGoHome?: () => void;
};

type ErrorBoundaryState = {
  error: Error | null;
};

const getReadableMessage = (error: Error) => {
  return error.message?.trim() || "No se pudo determinar la causa exacta.";
};

const getStackPreview = (error: Error) => {
  return error.stack?.split("\n").slice(0, 6).join("\n") ?? "";
};

class AppErrorBoundaryInner extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = {
    error: null,
  };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, errorInfo: unknown) {
    console.error("ErrorBoundary atrapó un error de render:", error, errorInfo);
  }

  componentDidUpdate(prevProps: ErrorBoundaryProps) {
    if (prevProps.resetKey !== this.props.resetKey && this.state.error) {
      this.setState({ error: null });
    }
  }

  render() {
    if (!this.state.error) {
      return this.props.children;
    }

    const error = this.state.error;
    const stackPreview = getStackPreview(error);

    return (
      <div className="vr-error-boundary-shell">
        <Card className="vr-error-boundary-card" bordered={false}>
          <Result
            status="error"
            title="No pudimos completar esta pantalla"
            subTitle="La aplicacion sigue activa. Puedes reintentar, volver al inicio o recargar mientras revisamos el detalle tecnico."
            extra={
              <Space wrap>
                <Button
                  type="primary"
                  onClick={() => this.setState({ error: null })}
                >
                  Intentar de nuevo
                </Button>
                {this.props.onGoHome ? (
                  <Button onClick={this.props.onGoHome}>Volver al inicio</Button>
                ) : null}
                <Button onClick={() => window.location.reload()}>
                  Recargar pagina
                </Button>
              </Space>
            }
          />

          <div className="vr-error-boundary-details">
            <Typography.Title level={5} className="vr-error-boundary-title">
              Detalle del error
            </Typography.Title>
            <Alert
              showIcon
              type="error"
              message={getReadableMessage(error)}
              description="Si estabas guardando informacion, puedes volver a intentar la accion despues de cerrar este mensaje."
            />

            {stackPreview ? (
              <div className="vr-error-boundary-stack">
                <Typography.Text strong>Resumen tecnico</Typography.Text>
                <pre>{stackPreview}</pre>
              </div>
            ) : null}
          </div>
        </Card>
      </div>
    );
  }
}

export const AppErrorBoundary = ({ children }: { children: ReactNode }) => {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <AppErrorBoundaryInner
      resetKey={location.pathname}
      onGoHome={() => navigate("/")}
    >
      {children}
    </AppErrorBoundaryInner>
  );
};

export const RootErrorBoundary = ({ children }: { children: ReactNode }) => {
  return <AppErrorBoundaryInner resetKey="root">{children}</AppErrorBoundaryInner>;
};
