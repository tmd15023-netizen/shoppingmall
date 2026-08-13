const PORTONE_API_BASE = "https://api.portone.io";

function getApiSecret() {
  return (process.env.PORTONE_API_SECRET || "").trim();
}

function createPaymentId() {
  // KG이니시스 oid 제한: 1~40자
  const rand = Math.random().toString(36).slice(2, 10);
  return `pay_${Date.now()}_${rand}`.slice(0, 40);
}

/**
 * PortOne V2 결제 단건 조회
 * @param {string} paymentId
 */
async function fetchPortonePayment(paymentId) {
  const secret = getApiSecret();
  if (!secret) {
    const error = new Error(
      "PORTONE_API_SECRET 이 설정되지 않았습니다. 서버 .env에 V2 API Secret을 넣어주세요."
    );
    error.code = "PORTONE_SECRET_MISSING";
    throw error;
  }

  const response = await fetch(
    `${PORTONE_API_BASE}/payments/${encodeURIComponent(paymentId)}`,
    {
      method: "GET",
      headers: {
        Authorization: `PortOne ${secret}`,
      },
    }
  );

  const text = await response.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.message ||
      data?.error?.message ||
      `포트원 결제 조회 실패 (${response.status})`;
    const error = new Error(message);
    error.code = "PORTONE_FETCH_FAILED";
    error.status = response.status;
    throw error;
  }

  return data;
}

/**
 * 주문 금액/상태와 포트원 결제 내역을 대조해 검증
 */
function assertPaymentMatchesOrder(payment, { expectedAmount, paymentMethod }) {
  if (!payment) {
    throw Object.assign(new Error("결제 정보를 확인할 수 없습니다."), {
      code: "PAYMENT_NOT_FOUND",
    });
  }

  const status = payment.status;
  const paidAmount = Number(
    payment.amount?.total ?? payment.amount?.paid ?? payment.totalAmount ?? NaN
  );
  const expected = Number(expectedAmount);

  if (!Number.isFinite(paidAmount) || !Number.isFinite(expected)) {
    throw Object.assign(new Error("결제 금액 정보가 올바르지 않습니다."), {
      code: "PAYMENT_AMOUNT_INVALID",
    });
  }

  if (paidAmount !== expected) {
    throw Object.assign(
      new Error(
        `결제 금액이 주문 금액과 일치하지 않습니다. (결제: ${paidAmount}, 주문: ${expected})`
      ),
      { code: "PAYMENT_AMOUNT_MISMATCH" }
    );
  }

  const isBank = paymentMethod === "bank";
  const allowedStatuses = isBank
    ? ["VIRTUAL_ACCOUNT_ISSUED", "WAITING_FOR_DEPOSIT", "PAID"]
    : ["PAID"];

  if (!allowedStatuses.includes(status)) {
    throw Object.assign(
      new Error(
        `결제가 완료되지 않았습니다. (상태: ${status || "unknown"})`
      ),
      { code: "PAYMENT_NOT_COMPLETED" }
    );
  }

  return {
    status,
    paidAmount,
    txId: payment.transactionId || payment.txId || "",
    paymentId: payment.id || payment.paymentId || "",
  };
}

/**
 * 결제 검증 (조회 + 금액/상태 확인)
 */
async function verifyPortonePayment({
  paymentId,
  expectedAmount,
  paymentMethod,
}) {
  const payment = await fetchPortonePayment(paymentId);
  return assertPaymentMatchesOrder(payment, { expectedAmount, paymentMethod });
}

module.exports = {
  createPaymentId,
  getApiSecret,
  fetchPortonePayment,
  assertPaymentMatchesOrder,
  verifyPortonePayment,
};
