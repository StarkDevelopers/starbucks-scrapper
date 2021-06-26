export type Payload = {
  previousAction: {
    payload: {
      data: {
        stores: {
          id: string,
          name: string,
          address: {
            city: string,
            postalCode: string,
          },
        }[]
      }
    }
  }
};