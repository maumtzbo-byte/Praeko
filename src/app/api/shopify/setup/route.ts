import { ShopifyAdminClient } from "@/lib/providers/shopify/client";
import type { ShopPolicyType } from "@/lib/providers/shopify/types";

/**
 * One-shot store setup: legal policies + basic pages (About/Contact). Manual
 * trigger for now, same stopgap pattern as the other /api/shopify routes —
 * this isn't meant to run more than once per store.
 */
export async function POST() {
  const client = new ShopifyAdminClient();
  const results: Record<string, string> = {};

  const policies: { type: ShopPolicyType; body: string }[] = [
    {
      type: "SHIPPING_POLICY",
      body: `
        <p>En Elora trabajamos con proveedores especializados para traerte productos de belleza coreana (K-beauty) directo a tu puerta. Por el origen de nuestros productos, los tiempos de entrega son los siguientes:</p>
        <ul>
          <li><strong>Procesamiento del pedido:</strong> 1-3 días hábiles.</li>
          <li><strong>Tiempo de envío:</strong> 10-20 días hábiles, dependiendo de tu ubicación dentro de México.</li>
        </ul>
        <p>Te enviaremos un número de guía en cuanto tu pedido sea despachado para que puedas rastrearlo. Los costos de envío se calculan al finalizar tu compra según tu ubicación y el peso del pedido.</p>
        <p>Si tu pedido no ha llegado dentro del tiempo estimado, contáctanos y lo revisamos contigo.</p>
      `,
    },
    {
      type: "REFUND_POLICY",
      body: `
        <p>Queremos que quedes satisfecho(a) con tu compra. Si tu producto llega dañado, incompleto o es distinto al que ordenaste, tienes <strong>15 días naturales</strong> a partir de la recepción para contactarnos y solicitar un cambio o reembolso.</p>
        <h3>Condiciones</h3>
        <ul>
          <li>El producto debe estar sin usar, en su empaque original.</li>
          <li>Incluye fotos del producto y del empaque al contactarnos, para agilizar tu solicitud.</li>
          <li>Los costos de envío originales no son reembolsables, salvo que el error haya sido nuestro.</li>
        </ul>
        <p>Los reembolsos se procesan a tu método de pago original dentro de los 10 días hábiles posteriores a la aprobación de tu solicitud. Conservas los derechos que te otorga la Ley Federal de Protección al Consumidor (PROFECO) independientemente de esta política.</p>
        <p>Para iniciar un cambio o devolución, escríbenos a través de nuestra página de <a href="/pages/contacto">Contacto</a>.</p>
      `,
    },
    {
      type: "PRIVACY_POLICY",
      body: `
        <p>En Elora respetamos tu privacidad. Esta política explica qué información recopilamos y cómo la usamos.</p>
        <h3>Información que recopilamos</h3>
        <p>Al comprar en nuestra tienda recopilamos datos como nombre, dirección de envío, correo electrónico y teléfono, necesarios para procesar y entregar tu pedido. La información de pago es procesada de forma segura por nuestro proveedor de pagos; nosotros no almacenamos los datos completos de tu tarjeta.</p>
        <h3>Uso de la información</h3>
        <p>Usamos tus datos para procesar pedidos, brindar soporte, y (solo si nos das tu consentimiento) enviarte novedades y promociones. No vendemos tu información personal a terceros.</p>
        <h3>Tus derechos</h3>
        <p>Puedes solicitar acceso, corrección o eliminación de tus datos personales en cualquier momento escribiéndonos desde nuestra página de <a href="/pages/contacto">Contacto</a>, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares.</p>
      `,
    },
    {
      type: "TERMS_OF_SERVICE",
      body: `
        <p>Al usar y comprar en elora.mx aceptas los siguientes términos:</p>
        <h3>Productos</h3>
        <p>Hacemos nuestro mejor esfuerzo por describir y mostrar fielmente cada producto. Los colores pueden variar ligeramente según tu pantalla.</p>
        <h3>Precios y pagos</h3>
        <p>Los precios están expresados en pesos mexicanos (MXN) e incluyen los impuestos aplicables, salvo que se indique lo contrario. Nos reservamos el derecho de corregir errores de precio evidentes antes de confirmar tu pedido.</p>
        <h3>Envíos y devoluciones</h3>
        <p>Consulta nuestra <a href="/policies/shipping-policy">Política de Envíos</a> y <a href="/policies/refund-policy">Política de Devoluciones</a> para más detalle.</p>
        <h3>Uso del sitio</h3>
        <p>No está permitido usar este sitio con fines fraudulentos o para infringir derechos de terceros. Podemos suspender el acceso a cualquier usuario que incumpla estos términos.</p>
        <p>Estos términos se rigen por las leyes de México. Cualquier controversia se resolverá ante los tribunales competentes, sin perjuicio de los derechos que la ley otorga a los consumidores para acudir ante PROFECO.</p>
      `,
    },
  ];

  for (const policy of policies) {
    try {
      await client.setShopPolicy(policy.type, policy.body);
      results[policy.type] = "ok";
    } catch (error) {
      results[policy.type] = error instanceof Error ? error.message : String(error);
    }
  }

  try {
    const about = await client.createPage(
      "Sobre nosotros",
      `
        <p>Elora nace de una obsesión sana: encontrar los productos de skincare coreano (K-beauty) que de verdad funcionan, antes de que se vuelvan tendencia en todos lados.</p>
        <p>Buscamos fórmulas efectivas, con ingredientes probados, y las traemos a México para que no tengas que andar buscando en diez tiendas distintas ni pagar de más por importación directa.</p>
        <p>Cada producto que vendemos lo elegimos porque nos gustaría usarlo nosotros mismos — no llenamos el catálogo por llenarlo.</p>
      `,
      "sobre-nosotros",
    );
    results.ABOUT_PAGE = about.handle;
  } catch (error) {
    results.ABOUT_PAGE = error instanceof Error ? error.message : String(error);
  }

  try {
    const contact = await client.createPage(
      "Contacto",
      `
        <p>¿Tienes dudas sobre tu pedido, un producto o una devolución? Escríbenos y te respondemos lo antes posible.</p>
        <p><strong>Correo:</strong> hola@elora.mx</p>
        <p>Horario de atención: Lunes a viernes, 9am - 6pm (hora del centro de México).</p>
      `,
      "contacto",
    );
    results.CONTACT_PAGE = contact.handle;
  } catch (error) {
    results.CONTACT_PAGE = error instanceof Error ? error.message : String(error);
  }

  return Response.json({ ok: true, results });
}
